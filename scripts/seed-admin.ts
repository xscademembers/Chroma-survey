import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is missing.");
}

const DB_NAME = "dr_sunita_db";

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(DB_NAME);
  const exists = await db.collection("admins").findOne({ username: "admin" });
  if (!exists) {
    await db.collection("admins").insertOne({
      username: "admin",
      password: "password",
      role: "admin",
      createdAt: new Date()
    });
    // eslint-disable-next-line no-console
    console.log("Default admin seeded.");
  } else {
    // eslint-disable-next-line no-console
    console.log("Default admin already exists.");
  }
  await client.close();
}

void seed();
