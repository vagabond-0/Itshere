use crate::{
    Error,
    auth::verify_jwt,
    model::{Comment, MissingPost, ModelController, PostWithUser},
    web::AUTH_TOKEN,
};
use axum::http::StatusCode;
use axum::{
    Json, Router,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};
use mongodb::bson::Uuid;
use serde_json::{Value, json};
use std::sync::Arc;
use tower_cookies::Cookies;

pub fn routes(controller: Arc<ModelController>) -> Router {
    Router::new()
        .route("/api/createpost", axum::routing::post(createpost))
        .route("/api/getallposts", axum::routing::get(get_posts))
        .route(
            "/api/posts/:post_id/comments",
            axum::routing::post(post_comment),
        )
        .route(
            "/api/posts/:post_id/getcomments",
            axum::routing::get(get_all_comment),
        )
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

    controller
        .add_post(post)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "status": "Post created successfully" })))
}

pub async fn get_posts(
    State(controller): State<Arc<ModelController>>,
) -> Result<Json<Vec<PostWithUser>>, StatusCode> {
    match controller.getallpost().await {
        Ok(posts) => Ok(Json(posts)),
        Err(e) => {
            eprintln!("Error in getallpost: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn post_comment(
    State(controller): State<Arc<ModelController>>,
    Path(post_id): Path<String>,
    cookies: Cookies,
    Json(comment_req): Json<comment_req>,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();

    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let username = claims.sub;

    let comment = Comment {
        id: Uuid::new(),
        user_id: username,
        message: comment_req.message,
    };

    match controller.add_comment_to_post(&post_id, comment).await {
        Ok(_) => Ok(Json(json!({
            "status": "success",
            "message": "Comment added successfully"
        }))),
        Err(Error::UserNotFound) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
pub async fn get_all_comment(
    State(controller): State<Arc<ModelController>>,
    Path(post_id): Path<String>,
    cookies: Cookies,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    
    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    println!("Fetching comments for post ID: {}", post_id);
    
    let object_id = match mongodb::bson::oid::ObjectId::parse_str(&post_id) {
        Ok(oid) => oid,
        Err(e) => {
            eprintln!("Invalid ObjectId format: {}", e);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let object_id_string = object_id.to_string();
    
    match controller.getallcomments(object_id_string).await {
        Ok(comments) => {
            println!("Found {} comments", comments.len());
            Ok(Json(json!({
                "status": "success",
                "comments": comments
            })))
        },
        Err(e) => {
            eprintln!("Error fetching comments: {:?}", e);
            
            match e {
                Error::PostNotFound => {
                    println!("Post not found");
                    Err(StatusCode::NOT_FOUND)
                },
                _ => {
                    println!("Internal server error");
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
    }
}


#[derive(Serialize, Deserialize,Debug)]
pub struct comment_req{
    pub message:String
}