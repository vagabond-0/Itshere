use actix_web::{body, get, post, web::{Data, Json}, App, HttpResponse, HttpServer, Responder};
use chrono::{DateTime, Utc};
use models::{user, Post, Postpostmodel};
use models::RequestUser;
use validator::Validate;
mod models;
use db::database;
use uuid;
mod db;
use actix_cors::Cors;


#[get("/")]
async fn print_hello() -> impl Responder{
    HttpResponse::Ok().body("helloworld")
}

#[post("/post")]
async fn userregister(body: Json<RequestUser>, db: Data<database>) -> impl Responder {
    // Validate the incoming request
    if let Err(_) = body.validate() {
        return HttpResponse::BadRequest().body("Invalid request data");
    }

    let mail = body.gmail.clone();
    match db.FindUserByEmail(mail.clone()).await {
        Ok(Some(existing_user)) => {
            HttpResponse::Ok().json(existing_user)
        }
        Ok(None) => {
            let mut buffer = uuid::Uuid::encode_buffer();
            let new_uuid = uuid::Uuid::new_v4().simple().encode_lower(&mut buffer);

            match db.create_user(new_uuid.to_string(), mail.clone()).await {
                Ok(new_user) => HttpResponse::Ok().json(new_user),
                Err(e) => {
                    eprintln!("Database insertion error: {:?}", e);
                    HttpResponse::InternalServerError().body("Error creating user")
                }
            }
        }
        Err(e) => {
            eprintln!("Database query error: {:?}", e);
            HttpResponse::InternalServerError().body("Error checking existing user")
        }
    }
}

 
//create a post 
#[post("/createpost")]
async fn create_post(db:Data<database>,body:Json<Postpostmodel>)->impl Responder{
    if let Err(_) = body.validate(){
        return HttpResponse::BadRequest().body("Invalid request data");
    }
    let user_id = body.user_id.clone();
    let description = body.description.clone();
    let image_link=body.image_link.clone();
    let post_type = body.post_type.clone();
    let time = body.time;
    let time = time.and_utc();
    let mut buffer = uuid::Uuid::encode_buffer();
    let new_uuid = uuid::Uuid::new_v4().simple().encode_lower(&mut buffer);

    let new_post = db.create_post(new_uuid.to_string(), user_id, description, image_link, post_type, time).await;

    match new_post{
        Ok(post) =>{
             HttpResponse::Ok().json(post)
        }
        Err(_) => {
           HttpResponse::InternalServerError().body("Error creating user")
        }
    }

}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db = database::init()
        .await
        .expect("error connecting");
    let db_data = Data::new(db);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method() 
            .allow_any_header(); 

        App::new()
            .app_data(db_data.clone())
            .wrap(cors) 
            .service(print_hello)
            .service(userregister)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}