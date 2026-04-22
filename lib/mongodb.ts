import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing. Set it in .env.local.");
}

const client = new MongoClient(uri);
const clientPromise = global._mongoClientPromise ?? client.connect();

if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}

export default clientPromise;
export const DB_NAME = "dr_sunita_db";
