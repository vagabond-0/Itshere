use crate::{Error,Result};
use mongodb::options::FindOptions;
use serde::{Serialize,Deserialize};
use mongodb::bson::oid::ObjectId;
use mongodb::{Collection,bson::doc};
use futures::stream::TryStreamExt;


#[derive(Clone, Debug, Serialize)]
pub struct User {
    pub id: u64,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User_Register{
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username:String,
    pub gmail:String,
    pub PhoneNumber:String,
    pub profile_picture:String,
    pub password:String
}

#[derive(Clone, Debug, Serialize,Deserialize)]
pub struct Comment {
    pub id: u64,
    pub user_id: String,
    pub message: String,
}

#[derive(Clone, Debug, Serialize,Deserialize)]
pub struct MissingPost {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub description: String,
    pub date: String,
    pub place: String,
    pub image_link: String,
    pub user: String,
    pub comments: Vec<Comment>,
}


#[derive(Debug, Deserialize)]
pub struct Post_payload {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub content: String,
    pub comments: Vec<Comment>, 
}

#[derive(Clone)]
pub struct ModelController {
    pub user_collection: Collection<User_Register>,
    pub post_collection: Collection<MissingPost>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPublic {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username: String,
    pub gmail: String,
    pub PhoneNumber: String,
    pub profile_picture: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostWithUser {
    pub id: Option<ObjectId>,
    pub description: String,
    pub date: String,
    pub place: String,
    pub image_link: String,
    pub user: UserPublic,
    pub comments: Vec<Comment>,
}


impl ModelController {
    pub fn new(db: mongodb::Database) -> Self {
        Self {
            user_collection: db.collection("users"),
            post_collection: db.collection("posts"),
        }
    }

    pub async fn register_user(&self, user_data: User_Register) -> Result<()> {
        let filter = doc! { "gmail": &user_data.gmail };
        if self.user_collection.find_one(filter, None).await?.is_some() {
            return Err(Error::UserWithMailExists);
        }

        self.user_collection.insert_one(user_data, None).await?;
        Ok(())
    }
    pub async fn find_user_by_username(&self, username: &str) -> Result<Option<User_Register>> {
        let user = self.user_collection
            .find_one(doc! { "username": username }, None)
            .await?;

        Ok(user)
    }

    pub async fn add_post(&self, post: MissingPost) -> Result<()> {
        self.post_collection.insert_one(post, None).await?;
        Ok(())
    }

    pub async fn getallpost(&self) -> Result<Vec<PostWithUser>> {
        let mut cursor = self
            .post_collection
            .find(None, FindOptions::default())
            .await?;
    
        let mut posts = Vec::new();
    
        while let Some(post) = cursor.try_next().await? {
            let user = self
                .user_collection
                .find_one(doc! { "username": &post.user }, None)
                .await?
                .ok_or(Error::DatabaseError("User does not exist".to_string()))?;
    
            let public_user = UserPublic {
                id: user.id,
                username: user.username,
                gmail: user.gmail,
                PhoneNumber: user.PhoneNumber,
                profile_picture: user.profile_picture,
            };
    
            posts.push(PostWithUser {
                id: post.id,
                description: post.description,
                date: post.date,
                place: post.place,
                image_link: post.image_link,
                user: public_user,
                comments: post.comments,
            });
        }
    
        Ok(posts)
    }
    
    
    
}
