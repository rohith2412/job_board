import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { syncFeeds } from "@/lib/job-review";

export const maxDuration = 300;

// Called daily; queues new roles from company job feeds for admin review.
export async function GET(req: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization")?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await syncFeeds());
}
