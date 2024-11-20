use actix_web::cookie::time;
use chrono::{DateTime, Utc};
use sqlx::{Pool, Postgres, postgres::PgPoolOptions, Error};
use std::env;
use dotenv::dotenv;

use crate::models::{Post, User::user};

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

    //delete a user 
    pub async fn delete_user(&self,uuid:String)->Result<Option<user>,Error>{
        let user_to_be_deleted = sqlx::query_as!(
            user,
            "select * from users where gmail = $1",
            uuid
        )
        .fetch_optional(&self.pool)
        .await?;

        if user_to_be_deleted.is_none(){
            return Ok(None);
        }

        sqlx::query!(
            "delete from users where uuid =  $1 ",
            uuid
        )
        .execute(&self.pool)
        .await?;

        Ok(user_to_be_deleted)
    }

    pub async fn FindUserByEmail(&self, gmail: String) -> Result<Option<user>, Error> {
        let result = sqlx::query_as!(
            user,
            "SELECT uuid, gmail FROM users WHERE gmail = $1",
            gmail
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(result)
    }

    // add a post

    pub async fn create_post(
        &self,
        uuid: String,
        user_id:String,
        description: String,
        image_link: String,
        post_type: String,
        time: DateTime<Utc>,
    ) -> Result<Post, Error> {
        let result = sqlx::query_as!(
            Post,
            "INSERT INTO post (uuid,user_id, description, image_link, post_type, time) 
             VALUES ($1, $2, $3, $4, $5,$6) 
             RETURNING uuid,user_id, description, image_link, post_type, time",
            uuid,
            user_id,
            description,
            image_link,
            post_type, 
            time
        ) 
        .fetch_one(&self.pool)
        .await?;
    
        Ok(result)
    }

    //delete a post 


    pub async fn delete_a_post(&self,uuid:String)->Result<Option<Post>,Error>{
        let post_to_delete = sqlx::query_as!(
            Post,
            "select * from post where uuid = $1",
            uuid
        )
        .fetch_optional(&self.pool)
        .await?;

        if post_to_delete.is_none(){
            return Ok(None);
        }

        sqlx::query!(
            "DELETE FROM post WHERE uuid = $1",
            uuid
        )
        .execute(&self.pool)
        .await?;
        Ok(post_to_delete)
    }   
}