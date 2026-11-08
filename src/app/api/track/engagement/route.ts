import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";

const MAX_DURATION_MS = 30 * 60 * 1000;

// Receives sendBeacons for a page view: { id, human: true } on the first real input, and
// { id, ms } when the visitor leaves, with how long the page was actually visible.
export async function POST(req: NextRequest) {
  try {
    const { id, ms, human } = JSON.parse(await req.text());
    if (!isValidObjectId(id)) return NextResponse.json({ ok: false }, { status: 400 });
    await connectDB();
    if (human === true) {
      await Visit.updateOne(
        { _id: id, human: false, createdAt: { $gte: new Date(Date.now() - 2 * MAX_DURATION_MS) } },
        { $set: { human: true } }
      );
      if (ms === undefined) return NextResponse.json({ ok: true });
    }
    const duration = Math.round(Number(ms));
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
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
