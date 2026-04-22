import { NextRequest, NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { addFallbackPatient, getFallbackPatients } from "@/lib/fallback-store";
import { PatientSubmission } from "@/types";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const rows = await db.collection("patients").find({}).sort({ submittedAt: -1 }).toArray();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(getFallbackPatients());
  }
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as PatientSubmission;

  if (!payload.fullName?.trim() || !payload.mobileNumber?.trim()) {
    return NextResponse.json({ error: "Name and mobile are required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const now = new Date();
    const recentDuplicate = await db.collection("patients").findOne({
      fullName: payload.fullName.trim(),
      mobileNumber: payload.mobileNumber.trim(),
      selectedCategory: payload.selectedCategory ?? "",
      reason: payload.reason ?? "",
      submittedAt: { $gte: new Date(now.getTime() - 5_000) }
    });

    if (recentDuplicate) {
      return NextResponse.json({ duplicate: true, message: "Duplicate check-in ignored." });
    }

    const doc = {
      ...payload,
      fullName: payload.fullName.trim(),
      mobileNumber: payload.mobileNumber.trim(),
      submittedAt: now,
      source: "nextjs-dr-sunita-app",
      userAgent: req.headers.get("user-agent") ?? "unknown"
    };

    await db.collection("patients").insertOne(doc);
    return NextResponse.json({ success: true });
  } catch {
    const now = new Date();
    addFallbackPatient({
      _id: `fallback-${now.getTime()}`,
      ...payload,
      fullName: payload.fullName.trim(),
      mobileNumber: payload.mobileNumber.trim(),
      submittedAt: now,
      source: "fallback-local-store",
      userAgent: req.headers.get("user-agent") ?? "unknown"
    });
    return NextResponse.json({ success: true, fallback: true });
  }
}
