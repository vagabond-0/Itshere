pub use self::error::{Error, Result};
use axum::{Router, middleware, response::Response};
use db::connect_to_db;
use model::ModelController;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_cookies::CookieManagerLayer;
use tracing_subscriber::layer;
use tower_http::cors::{Any, CorsLayer};
mod auth;
mod db;
mod error;
mod model;
mod web;
#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init(); // Optional logging

    let db = connect_to_db().await.unwrap();
    let controller = Arc::new(ModelController::new(db));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers(Any)
        .allow_credentials(false);

    let app = Router::new()
        .merge(web::routes_login::routes(controller.clone()))
        .merge(web::routes_post::routes(controller.clone()))
        .merge(web::route_edit::routes(controller.clone()))
        .merge(web::routes_chat::routes(controller.clone()))
        .layer(cors)
        .layer(CookieManagerLayer::new());

    // ✅ Hardcoded address for deployment
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
