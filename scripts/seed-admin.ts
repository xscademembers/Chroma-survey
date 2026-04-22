import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing.");
}
const MONGODB_URI: string = process.env.MONGODB_URI;

const DB_NAME = "dr_sunita_db";

async function seed() {
  const client = new MongoClient(MONGODB_URI);
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
