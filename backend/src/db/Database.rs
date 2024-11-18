use sqlx::{Pool, Postgres, postgres::PgPoolOptions, Error};
use std::env;
use dotenv::dotenv;

use crate::models::User::user;

#[derive(Clone)]
pub struct database {
    pub pool: Pool<Postgres>,
}

impl database {
    pub async fn init() -> Result<Self, Error> {
        dotenv().ok();
        let database_url = env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set in .env file");
        
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        Ok(database { pool })
    }

    pub async fn create_user(&self, uuid: String, gmail: String) -> Result<user, Error> {
        let result = sqlx::query_as!(
            user,
            "INSERT INTO users (uuid, gmail) VALUES ($1, $2) RETURNING uuid, gmail",
            uuid,
            gmail
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result)
    }

    pub async fn FindUserByEmail(&self, gmail: String) -> Result<Option<user>, Error> { // Fixed return type to Option<user>
        let result = sqlx::query_as!(
            user,
            "SELECT uuid, gmail FROM users WHERE gmail = $1",
            gmail
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(result)
    }
}