use std::string;

use chrono::{DateTime, Utc}; 
use serde::{Deserialize,Serialize};
use validator::Validate;


#[derive(Validate,Deserialize,Serialize)]
pub struct RequestUser{
    pub gmail:String
}

#[derive(Validate,Deserialize,Serialize)]

pub struct user{
    pub uuid:String,
    pub gmail:String
}

impl user{
    pub fn new(
        uuid:String,
        mail:String
    ) -> user{
        user{
            uuid,
            gmail:mail
        }
    }
}





#[derive(Validate, Deserialize, Serialize)]
pub struct Post {
    pub uuid: String,
    pub description: String,
    pub image_link: String,
    pub post_type: String,
    pub time: DateTime<Utc>, 
}

impl Post {
    pub fn new(uuid: String, description: String, image_link: String, post_type: String, time: DateTime<Utc>) -> Post {
        Post {
            uuid,
            description,
            image_link,
            post_type,
            time,
        }
    }
}