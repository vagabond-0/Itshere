use actix_web::{get, post, web::{Data, Json}, App, HttpResponse, HttpServer, Responder};
use models::user;
use models::RequestUser;
use validator::Validate;
mod models;
use db::database;
use uuid;
mod db;
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


#[actix_web::main]
async fn main() -> std::io::Result<()>{
    

    let db = database::init()
            .await
            .expect("error connecting");
    let db_data = Data::new(db);

    HttpServer::new(
        move ||{
            App::new()
                .app_data(db_data.clone())
                .service(print_hello)
                .service(userregister)
        }
    )
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}