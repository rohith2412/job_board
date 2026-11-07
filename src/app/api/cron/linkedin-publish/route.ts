import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { publishPost } from "@/lib/linkedin";
import { LinkedInPost } from "@/models/LinkedInPost";

const BATCH_SIZE = 5;

// Called on a schedule; publishes every scheduled post whose time has come.
export async function GET(req: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const due = await LinkedInPost.find({ status: "scheduled", scheduledFor: { $lte: new Date() } })
    .sort({ scheduledFor: 1 })
    .limit(BATCH_SIZE)
    .select("_id")
    .lean();

  const published: string[] = [];
  const failed: { id: string; error?: string }[] = [];
  for (const { _id } of due) {
    const outcome = await publishPost(String(_id), ["scheduled"]);
    if (!outcome.claimed) continue;
    if (outcome.post.status === "posted") published.push(String(_id));
    else failed.push({ id: String(_id), error: outcome.post.lastError });
  }

  return NextResponse.json({ checked: due.length, published, failed });
}
