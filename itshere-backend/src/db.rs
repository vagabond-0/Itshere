use mongodb::{Client, Database};

pub async fn connect_to_db() -> mongodb::error::Result<Database> {
    let uri = "mongodb+srv://amalendumanoj:zJIVjnTCHSTXcBNC@cluster0.rfk8osq.mongodb.net/";
    let client = Client::with_uri_str(&uri).await?;
    Ok(client.database("lost_and_found"))
}
