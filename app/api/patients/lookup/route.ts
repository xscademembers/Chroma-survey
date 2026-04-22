import { NextRequest, NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { findFallbackByMobile } from "@/lib/fallback-store";

export async function POST(req: NextRequest) {
  const { mobileNumber } = (await req.json()) as { mobileNumber?: string };
  const mobile = mobileNumber?.trim();
  if (!mobile) {
    return NextResponse.json({ error: "mobileNumber is required" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const row = await db.collection("patients").findOne(
      { mobileNumber: mobile },
      { sort: { submittedAt: -1 }, projection: { fullName: 1 } }
    );

    return NextResponse.json({ found: Boolean(row), fullName: row?.fullName ?? null });
  } catch {
    const fallbackRow = findFallbackByMobile(mobile);
    return NextResponse.json({
      found: Boolean(fallbackRow),
      fullName: fallbackRow?.fullName ?? null
    });
  }
}
