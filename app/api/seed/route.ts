import { NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";

const DEFAULT_ADMIN = {
  username: "admin",
  password: "password",
  role: "admin",
  createdAt: new Date()
};

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const exists = await db.collection("admins").findOne({ username: "admin" });
  return NextResponse.json({ exists: Boolean(exists) });
}

export async function POST() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const exists = await db.collection("admins").findOne({ username: "admin" });
  if (exists) {
    return NextResponse.json({ created: false, message: "Already exists" });
  }

  await db.collection("admins").insertOne(DEFAULT_ADMIN);
  return NextResponse.json({ created: true });
}
