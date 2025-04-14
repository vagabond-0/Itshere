use std::sync::Arc;
use crate::{auth::verify_jwt, model::{Comment, MissingPost, ModelController, PostWithUser}, web::AUTH_TOKEN};
use axum::{extract::State, Json, Router};
use mongodb::bson::Uuid;
use serde_json::{json, Value};
use tower_cookies::Cookies;
use axum::http::StatusCode;

pub fn routes(controller: Arc<ModelController>) -> Router {
    Router::new()
        .route("/api/createpost", axum::routing::post(createpost))
        .route("/api/getallposts",axum::routing::get(get_posts))
        .with_state(controller)
}

pub async fn createpost(
    State(controller): State<Arc<ModelController>>,
    cookies: Cookies,
    Json(mut post): Json<MissingPost>,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();

    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    post.user = claims.sub;
    post.comments = vec![];

    
    controller.add_post(post).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "status": "Post created successfully" })))
}

pub async fn get_posts(State(controller): State<Arc<ModelController>>) -> Result<Json<Vec<PostWithUser>>, StatusCode> {
    match controller.getallpost().await {
        Ok(posts) => Ok(Json(posts)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}