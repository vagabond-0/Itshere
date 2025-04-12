use axum::{middleware, response::Response, Router};
use tower_cookies::CookieManagerLayer;
use std::net::SocketAddr;
pub use self::error::{
    Result,
    Error,
};
mod error;
mod web;
mod model;
mod auth;
#[tokio::main]
async fn main() {
    let routers = Router::new()
        .merge(web::routes_login::routes())
        .layer(CookieManagerLayer::new());
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("Listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(routers.into_make_service())
        .await
        .unwrap();

    println!("Server started");
}

