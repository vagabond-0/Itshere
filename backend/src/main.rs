use actix_web::{get, post, web::{Json}, App, HttpResponse, HttpServer, Responder};
use models::user;
use validator::Validate;
mod models;
use uuid;

#[get("/")]
async fn print_hello() -> impl Responder{
    HttpResponse::Ok().body("helloworld")
}

#[post("/post")]
async fn userregister(body:Json<user>) -> impl Responder{
    let is_valid = body.validate();
    match is_valid{
        Ok(_)=>{
            let mail = body.gmail.clone();
            let mut buffer = uuid::Uuid::encode_buffer();
            let new_uuid = uuid::Uuid::new_v4().simple().encode_lower(&mut buffer);

            let new_user = user::new(new_uuid.to_string(), mail);
            HttpResponse::Ok().body(format!("Created new blog"));
        },
        Err(_)=>{
             HttpResponse::InternalServerError().body("Error creating new blog");
        }
    }
    HttpResponse::Ok().body("response")
}


#[actix_web::main]
async fn main() -> std::io::Result<()>{
    HttpServer::new(
        ||{
            App::new()
                .service(print_hello)
                .service(userregister)
        }
    )
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}