use crate::{Error,Result};
use serde::{Serialize,Deserialize};
use mongodb::bson::oid::ObjectId;
use mongodb::{Collection,bson::doc};
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

#[derive(Clone, Debug, Serialize)]
pub struct Comment {
    pub id: u64,
    pub user: User,
    pub message: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MissingPost {
    pub id: u64,
    pub description: String,
    pub date: String,
    pub place: String,
    pub image_link: String,
    pub user: User,
    pub comments: Vec<Comment>,
}

#[derive(Deserialize)]
pub struct MissingPostCreate {
    pub description: String,
    pub date: String,
    pub place: String,
    pub image_link: String,
    pub user_id: u64, 
}


#[derive(Clone)]
pub struct ModelController {
    pub user_collection: Collection<User_Register>,
    pub post_collection: Collection<MissingPost>,
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

    pub async fn add_post(&self, post: MissingPost) -> Result<()> {
        self.post_collection.insert_one(post, None).await?;
        Ok(())
    }
    pub async fn find_user_by_username(&self, username: &str) -> Result<Option<User_Register>> {
        let user = self.user_collection
            .find_one(doc! { "username": username }, None)
            .await?;

        Ok(user)
    }

}
