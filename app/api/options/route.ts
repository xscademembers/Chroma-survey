import { NextRequest, NextResponse } from "next/server";
import clientPromise, { DB_NAME } from "@/lib/mongodb";
import { getFallbackFormOptions, setFallbackFormOptions } from "@/lib/fallback-options-store";
import { FormOptions } from "@/types";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const options = await db.collection("form_options").findOne({ key: "global_options" });
    if (!options) {
      return NextResponse.json(getFallbackFormOptions());
    }

    const normalized = {
      reasons: options.reasons ?? [],
      sources: options.sources ?? []
    };
    setFallbackFormOptions(normalized);
    return NextResponse.json(normalized);
  } catch {
    // Keep UI functional even if DB is temporarily unavailable.
    return NextResponse.json(getFallbackFormOptions());
  }
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as FormOptions;
  const reasons = Array.isArray(payload.reasons) ? payload.reasons : [];
  const sources = Array.isArray(payload.sources) ? payload.sources : [];

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    await db.collection("form_options").updateOne(
      { key: "global_options" },
      {
        $set: {
          reasons,
          sources,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    setFallbackFormOptions({ reasons, sources });
    return NextResponse.json({ success: true });
  } catch {
    setFallbackFormOptions({ reasons, sources });
    return NextResponse.json({ success: true, fallback: true });
  }
}
