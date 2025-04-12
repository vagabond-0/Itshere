use crate::{auth::create_jwt, Error, Result};
use serde::Deserialize;
use axum::{Json, Router};
use serde_json::{json, Value};
use axum::routing::post;
use tower_cookies::{Cookie, Cookies};
use crate::model::{ModelController,User_Register};
use std::sync::Arc;
use axum::extract::State;
use crate::web::AUTH_TOKEN;

pub fn routes() -> Router{
    Router::new().route("/api/login", post(api_login))
}

async fn api_login(cookies: Cookies, Json(payload): Json<LoginPayload>) -> Result<Json<Value>> {
    if payload.username != "demo1" || payload.pwd != "welcome" {
        return Err(Error::LoginFail);
    }

    let token = create_jwt(&payload.username)?;
    cookies.add(Cookie::new(AUTH_TOKEN, token.clone()));

    let body = Json(json!({
        "result": {
            "success": true,
            "token": token
        }
    }));

    Ok(body)
}


async fn create_user(
    State(controller): State<Arc<ModelController>>,
    Json(payload): Json<User_Register>,
    cookies: Cookies,
) -> Result<Json<Value>> {
    controller.register_user(payload).await?;

    cookies.add(Cookie::new(AUTH_TOKEN, "registered"));

    let body = Json(json!({
        "result": {
            "success": true,
            "message": "User registered successfully"
        }
    }));

    Ok(body)
}


#[derive(Debug,Deserialize)]
struct LoginPayload{
    username:String,
    pwd:String
}