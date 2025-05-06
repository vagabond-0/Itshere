use crate::{error::Error, error::Result};
use futures::stream::TryStreamExt;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::{to_bson, uuid};
use mongodb::options::FindOptions;
use mongodb::{Collection, bson::doc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize)]
pub struct User {
    pub id: u64,
    pub username: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatRoom {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user1: String,
    pub user2: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatMessage {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub char_id: String,
    pub sender: String,
    pub send_at: String,
    pub message: String,
    pub is_read: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User_Register {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub username: String,
    pub gmail: String,
    pub PhoneNumber: String,
    pub profile_picture: String,
    pub password: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Comment {
    pub id: uuid::Uuid,
    pub user_id: String,
    pub message: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
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
    pub chat_room_collection: Collection<ChatRoom>,
    pub chat_message_collection: Collection<ChatMessage>,
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
            chat_room_collection: db.collection("chat_rooms"),
            chat_message_collection: db.collection("chat"),
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
        let user = self
            .user_collection
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

    pub async fn edit_username(&self, user: &User_Register, gmail: &str) -> Result<()> {
        let user_id = match &user.id {
            Some(id) => id,
            None => return Err(Error::UserNotFound),
        };

        let existing_user = self
            .user_collection
            .find_one(doc! { "gmail": gmail }, None)
            .await?;

        if existing_user.is_some() {
            return Err(Error::UserWithMailExists);
        }
        let filter = doc! { "_id": user_id };
        let update = doc! {
            "$set": { "gmail": &gmail }
        };

        let result = self
            .user_collection
            .update_one(filter, update, None)
            .await?;

        if result.matched_count == 0 {
            return Err(Error::UserNotFound);
        }

        Ok(())
    }

    pub async fn changephonenumber(&self, user: &User_Register, phoneNumber: &str) -> Result<()> {
        let user_id = match &user.id {
            Some(id) => id,
            None => return Err(Error::UserNotFound),
        };

        let filter = doc! { "_id": user_id };
        let update = doc! {
            "$set": { "PhoneNumber": &phoneNumber }
        };

        let result = self
            .user_collection
            .update_one(filter, update, None)
            .await?;

        if result.matched_count == 0 {
            return Err(Error::UserNotFound);
        }

        Ok(())
    }
    pub async fn get_posts_by_user(&self, username: &str) -> Result<Vec<PostWithUser>> {
        let filter = doc! { "user": username };

        let mut cursor = self
            .post_collection
            .find(filter, FindOptions::default())
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

    pub async fn add_comment_to_post(&self, post_id: &str, comment: Comment) -> Result<()> {
        let obj_id = ObjectId::parse_str(post_id).map_err(|_| Error::UserNotFound)?;

        let filter = doc! { "_id": obj_id };
        let update = doc! {
            "$push": { "comments": to_bson(&comment).map_err(|_| Error::UserNotFound )? }
        };

        let result = self
            .post_collection
            .update_one(filter, update, None)
            .await?;

        if result.matched_count == 0 {
            return Err(Error::PostNotFound);
        }

        Ok(())
    }

    pub async fn getallcomments(&self, post_id: String) -> Result<Vec<Comment>> {
        let object_id = match mongodb::bson::oid::ObjectId::parse_str(&post_id) {
            Ok(oid) => oid,
            Err(_) => return Err(Error::PostNotFound),
        };
        let post = self
            .post_collection
            .find_one(doc! { "_id": object_id }, None)
            .await?
            .ok_or(Error::PostNotFound)?;
        Ok(post.comments)
    }

    pub async fn create_or_get_chat(&self, user1: String, user2: String) -> Result<ChatRoom> {
        let user1_exists = self
            .user_collection
            .find_one(doc! { "username": &user1 }, None)
            .await?;
        if user1_exists.is_none() {
            return Err(Error::UserNotFound);
        }

        let user2_exists = self
            .user_collection
            .find_one(doc! { "username": &user2 }, None)
            .await?;
        if user2_exists.is_none() {
            return Err(Error::UserNotFound);
        }

        let filter = doc! {
            "$or": [
                { "user1": &user1, "user2": &user2 },
                { "user1": &user2, "user2": &user1 }
            ]
        };
        if let Some(chat) = self.chat_room_collection.find_one(filter, None).await? {
            println!("Found existing chat with ID: {:?}", chat.id);
       
            return Ok(chat);
        }
        let now = chrono::Utc::now().to_rfc3339();
        let chat_room = ChatRoom {
            id: None,
            user1,
            user2,
            created_at: now,
        };
        let insert_result = self
            .chat_room_collection
            .insert_one(&chat_room, None)
            .await?;
        let id = insert_result
            .inserted_id
            .as_object_id()
            .ok_or(Error::DatabaseError(String::from(
                "Failed to get inserted ID",
            )))?;

        Ok(ChatRoom {
            id: Some(id),
            ..chat_room
        })
    }
    pub async fn send_message(
        &self,
        chat_id: &str,
        sender: String,
        message: String,
    ) -> Result<ChatMessage> {
        let chat_obj_id = ObjectId::parse_str(chat_id).map_err(|_| Error::InvalidToken)?;
        let chat = self
            .chat_room_collection
            .find_one(doc! { "_id": &chat_obj_id }, None)
            .await?
            .ok_or(Error::ChatNotFound)?;

        if chat.user1 != sender && chat.user2 != sender {
            return Err(Error::Unauthorized);
        }

        let now = chrono::Utc::now().to_rfc3339();
        let chat_message = ChatMessage {
            id: None,
            char_id: chat_id.to_string(),
            sender,
            message,
            send_at: now,
            is_read: false,
        };

        let insert_result = self.chat_message_collection.insert_one(&chat_message, None).await?;
        let id = insert_result
            .inserted_id
            .as_object_id()
            .ok_or(Error::DatabaseError("Failed to get inserted ID".into()))?;

        Ok(ChatMessage {
            id: Some(id),
            ..chat_message
        })
    }
    pub async fn get_chat_messages(&self, chat_id: &str) -> Result<Vec<ChatMessage>> {
        println!("Getting messages for chat ID: {}", chat_id);
        
        // Find messages for this chat
        let filter = doc! { "char_id": chat_id }; // Make sure field name matches your struct
        
        let options = mongodb::options::FindOptions::builder()
            .sort(doc! { "send_at": 1 }) // Sort by time, oldest first
            .build();
            
        let mut cursor = self.chat_message_collection.find(filter, options).await?;
        
        let mut messages = Vec::new();
        while let Some(message) = cursor.try_next().await? {
            messages.push(message);
        }
        
        println!("Found {} messages", messages.len());
        
        Ok(messages)
    }
    pub async fn get_chat_rooms(&self, username: &str) -> Result<Vec<ChatRoom>> {
        let filter = doc! {
            "$or": [
                { "user1": username },
                { "user2": username }
            ]
        };

        let mut cursor = self.chat_room_collection.find(filter, None).await?;
        let mut chat_rooms = Vec::new();

        while let Some(chat_room) = cursor.try_next().await? {
            chat_rooms.push(chat_room);
        }

        Ok(chat_rooms)
    }

}
