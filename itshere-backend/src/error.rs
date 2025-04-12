use axum::{response::{IntoResponse, Response},http::StatusCode};
pub type Result<T> = core::result::Result<T,Error>;

#[derive(Debug)]
pub enum Error{
    LoginFail,
    UserWithMailExists,
    TokenCreation,
    InvalidToken,
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        println!("Error: {:?}", self);
        match self {
            Error::LoginFail => (
                StatusCode::UNAUTHORIZED,
                "Invalid username or password",
            ),
            Error::UserWithMailExists => (
                StatusCode::CONFLICT,
                "A user with this email already exists",
            ),
            Error::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token"),
            Error::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid or expired token"),

        }
        .into_response()
    }
}
