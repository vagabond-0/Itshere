use crate::{Error,Result};
use serde::{Serialize,Deserialize};
use std::sync::{Arc,Mutex};

#[derive(Clone, Debug, Serialize)]
pub struct User {
    pub id: u64,
    pub username: String,
}

#[derive(Clone,Debug,Deserialize)]
pub struct User_Register{
    pub id:u64,
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
    pub post_items: Arc<Mutex<Vec<MissingPost>>>,
    pub users: Arc<Mutex<Vec<User_Register>>>,
}


impl ModelController {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            post_items: Arc::new(Mutex::new(Vec::new())),
            users: Arc::new(Mutex::new(Vec::new())),
        })
    }

    pub async fn register_user(&self, user_data: User_Register) -> Result<()> {
        let mut users = self.users.lock().unwrap();

        if users.iter().any(|u| u.gmail == user_data.gmail) {
            return Err(Error::UserWithMailExists);
        }

        let user = User_Register {
            id: user_data.id,
            username: user_data.username,
            gmail:user_data.gmail,
            PhoneNumber:user_data.PhoneNumber,
            password:user_data.password,
            profile_picture:user_data.profile_picture
        };

        users.push(user);
        Ok(())
    }

    pub async fn add_post(&self, post: MissingPost) -> Result<()> {
        let mut posts = self.post_items.lock().unwrap();
        posts.push(post);
        Ok(())
    }

    pub async fn get_posts(&self) -> Result<Vec<MissingPost>> {
        let posts = self.post_items.lock().unwrap();
        Ok(posts.clone())
    }

    pub async fn add_comment(&self, post_id: u64, comment: Comment) -> Result<()> {
        let mut posts = self.post_items.lock().unwrap();
        if let Some(post) = posts.iter_mut().find(|p| p.id == post_id) {
            post.comments.push(comment);
        }
        Ok(())
    }
}
