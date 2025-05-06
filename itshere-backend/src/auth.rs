use serde::{Deserialize,Serialize};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use crate::error::Error;
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize, 
}

const SECRET: &[u8] = b"ioRFHMleDUkukPt2fdxvxCV7KLtoiH7CEyTj5N4NwpT7JimGstwljHLbogRClaXoxGnrgrObHEow4XPqcuKdmw==";

pub fn create_jwt(username: &str) -> Result<String, Error> {
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: username.to_owned(),
        exp: expiration,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(SECRET))
        .map_err(|_| Error::TokenCreation)
}

pub fn verify_jwt(token: &str) -> Result<Claims, Error> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(SECRET),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| Error::InvalidToken)
}
