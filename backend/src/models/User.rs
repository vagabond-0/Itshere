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