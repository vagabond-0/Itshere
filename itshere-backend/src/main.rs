pub use self::error::{Error, Result};
use axum::{Router, middleware, response::Response};
use db::connect_to_db;
use model::ModelController;
use tracing_subscriber::layer;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_cookies::CookieManagerLayer;
mod auth;
mod db;
mod error;
mod model;
mod web;
#[tokio::main]
async fn main() {
    let db = connect_to_db().await.unwrap();
    let controller = Arc::new(ModelController::new(db));

    let app = Router::new()
            .merge(web::routes_login::routes(controller.clone()))
            .layer(CookieManagerLayer::new());


    axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
