use crate::{
    auth::{Claims, verify_jwt},
    model::{Comment, MissingPost, ModelController, PostWithUser},
    web::AUTH_TOKEN,
};
use axum::http::StatusCode;
use axum::{
    Json, Router,
    extract::{Path, State},
};
use mongodb::bson::{Uuid, doc};
use serde_json::{Value, json};
use std::sync::Arc;
use tower_cookies::Cookies;

pub fn routes(controller: Arc<ModelController>) -> Router {
    Router::new()
        .route("/api/editusername/:gmail", axum::routing::put(editgmail))
        .route(
            "/api/editphone/:phone",
            axum::routing::put(edit_phonenumber),
        )
        .route("/api/userposts/:username", axum::routing::get(getuserpost))
        .with_state(controller)
}

pub async fn editgmail(
    State(controller): State<Arc<ModelController>>,
    Path(gmail): Path<String>,
    cookies: Cookies,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let u_name = claims.sub;
    println!(" {}", u_name);
    let user = controller
        .user_collection
        .find_one(doc! { "username": &u_name }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;
    controller
        .edit_username(&user, &gmail)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Json(json!({ "status": "gmail updated successfully" })))
}

pub async fn edit_phonenumber(
    State(controller): State<Arc<ModelController>>,
    Path(phone): Path<String>,
    cookies: Cookies,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let u_name = claims.sub;
    println!(" {}", u_name);
    let user = controller
        .user_collection
        .find_one(doc! { "username": &u_name }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;
    controller
        .changephonenumber(&user, &phone)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Json(
        json!({ "status": "phone number  updated successfully" }),
    ))
}

pub async fn getuserpost(
    State(controller): State<Arc<ModelController>>,
    Path(username): Path<String>,
    cookies: Cookies,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    let Claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let user = controller
        .user_collection
        .find_one(doc! { "username": &username }, None)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    let posts = controller
        .get_posts_by_user(&username)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Return the posts as JSON
    Ok(Json(json!({
    "status": "success",
    "count": posts.len(),
    "posts": posts
    })))
}
