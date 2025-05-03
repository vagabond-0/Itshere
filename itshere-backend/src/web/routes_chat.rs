use crate::{
    auth::{Claims, verify_jwt},
    model::{Comment, MissingPost, ModelController, PostWithUser},
    web::AUTH_TOKEN,
};
use serde::{Deserialize,Serialize};
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
        .route("/api/chat/create/:username", axum::routing::post(create_chat))
        .route("/api/chat/:username", axum::routing::post(send_message))
        .route("/api/chat/:username", axum::routing::get(get_chat))
        .with_state(controller)
}
pub async fn create_chat(
    State(controller): State<Arc<ModelController>>,
    Path(username): Path<String>,
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
    controller
        .create_or_get_chat(u_name, username)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Json(json!({ "status": "chat created successfully" })))
}
#[derive(Deserialize, Serialize)]
pub struct Message {
    pub message: String,
}

pub async fn send_message(
    State(controller): State<Arc<ModelController>>,
    Path(username): Path<String>,
    cookies: Cookies,
    Json(payload): Json<Message>,
) -> Result<Json<Value>, StatusCode> {
   
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let u_name = claims.sub;
    
    println!("Sending message from {} to {}: {}", 
        u_name, username, payload.message);
    
    
    let chat_room = match controller.create_or_get_chat(u_name.clone(), username).await {
        Ok(room) => room,
        Err(e) => {
            eprintln!("Error creating/getting chat: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    
    let chat_id = match chat_room.id.as_ref() {
        Some(id) => id.to_string(),
        None => {
            eprintln!("Chat room has no ID");
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    println!("Got chat ID: {}", chat_id);
    
    match controller.send_message(&chat_id, u_name.clone(), payload.message).await {
        Ok(message) => {
            println!("Message sent successfully");
            Ok(Json(json!({ 
                "status": "success", 
                "message": "Message sent successfully",
                "data": message
            })))
        },
        Err(e) => {
            eprintln!("Error sending message: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_chat(
    State(controller): State<Arc<ModelController>>,
    Path(username): Path<String>,
    cookies: Cookies,
) -> Result<Json<Value>, StatusCode> {
    let token = cookies
        .get(AUTH_TOKEN)
        .ok_or(StatusCode::UNAUTHORIZED)?
        .value()
        .to_string();
    let claims = verify_jwt(&token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    let u_name = claims.sub;
    
    println!("Getting chat for {} with {}", u_name, username);
    
    let chat_room = match controller.create_or_get_chat(u_name.clone(), username).await {
        Ok(room) => room,
        Err(e) => {
            eprintln!("Error creating/getting chat: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    let chat_id = match chat_room.id.as_ref() {
        Some(id) => id.to_string(),
        None => {
            eprintln!("Chat room has no ID");
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };
    
    println!("Got chat ID: {}", chat_id);
    
    match controller.get_chat_messages(&chat_id).await {
        Ok(messages) => {
            println!("Messages retrieved successfully");
            Ok(Json(json!({ 
                "status": "success", 
                "messages": messages
            })))
        },
        Err(e) => {
            eprintln!("Error retrieving messages: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}