import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { publishDuePosts } from "@/lib/linkedin";
import { runAutopilot } from "@/lib/linkedin-autopilot";

export const maxDuration = 300;

// Called on a schedule; publishes every scheduled post whose time has come.
export async function GET(req: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization")?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const published = await publishDuePosts();
  // Refill the queue after publishing so the next days always have posts lined up.
  const autopilot = await runAutopilot().catch((err) => ({ error: err instanceof Error ? err.message : String(err) }));
  return NextResponse.json({ ...published, autopilot });
}
