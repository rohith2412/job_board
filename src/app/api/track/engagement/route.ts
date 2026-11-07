import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";

const MAX_DURATION_MS = 30 * 60 * 1000;

// Receives a sendBeacon when the visitor leaves a page, with how long the page was actually visible.
export async function POST(req: NextRequest) {
  try {
    const { id, ms } = JSON.parse(await req.text());
    const duration = Math.round(Number(ms));
    if (!isValidObjectId(id) || !Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await connectDB();
    // Only the first report counts, and only shortly after the visit, so a replayed beacon can't rewrite history.
    await Visit.updateOne(
      { _id: id, durationMs: { $exists: false }, createdAt: { $gte: new Date(Date.now() - 2 * MAX_DURATION_MS) } },
      { $set: { durationMs: Math.min(duration, MAX_DURATION_MS) } }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
