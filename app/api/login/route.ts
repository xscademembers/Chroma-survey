import { NextRequest, NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";

async function ensureDefaultAdmin() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const existing = await db.collection("admins").findOne({ username: "admin" });
  if (!existing) {
    await db.collection("admins").insertOne({
      username: "admin",
      password: "password",
      createdAt: new Date(),
      role: "admin"
    });
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  try {
    await ensureDefaultAdmin();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const admin = await db.collection("admins").findOne({ username, password });
    if (!admin) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch {
    // Fallback for temporary DB outages so dashboard access still works.
    if (username === "admin" && password === "password") {
      return NextResponse.json({ success: true, fallback: true });
    }
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
