use crate::{auth::create_jwt, Error, Result};
use serde::Deserialize;
use axum::{Json, Router};
use serde_json::{json, Value};
use axum::routing::post;
use tower_cookies::{Cookie, Cookies};
use crate::model::{ModelController, User_Register};
use std::sync::Arc;
use axum::extract::State;
use crate::web::AUTH_TOKEN;

pub fn routes(controller: Arc<ModelController>) -> Router {
    Router::new()
        .route("/api/login", post(api_login))
        .route("/api/register", post(create_user))
        .with_state(controller) 
}

pub async fn api_login(
    State(controller): State<Arc<ModelController>>,
    cookies: Cookies,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<Value>> {
    let user = controller
        .find_user_by_username(&payload.username)
        .await?
        .ok_or(Error::LoginFail)?; 

    if user.password != payload.pwd {
        return Err(Error::LoginFail);
    }

    let token = create_jwt(&payload.username)?;
    cookies.add(Cookie::new(AUTH_TOKEN, token.clone()));

    Ok(Json(json!({
        "result": {
            "success": true,
            "token": token
        }
    })))
}

async fn create_user(
    State(controller): State<Arc<ModelController>>,
    cookies: Cookies,
    Json(payload): Json<User_Register>,
) -> Result<Json<Value>> {
    controller.register_user(payload).await?;
    cookies.add(Cookie::new(AUTH_TOKEN, "registered"));
    Ok(Json(json!({
        "result": {
            "success": true,
            "message": "User registered successfully"
        }
    })))
}
#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    username: String,
    pwd: String,
}
