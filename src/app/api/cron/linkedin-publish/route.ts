import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { publishDuePosts } from "@/lib/linkedin";

// Called on a schedule; publishes every scheduled post whose time has come.
export async function GET(req: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization")?.trim() !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await publishDuePosts());
}
