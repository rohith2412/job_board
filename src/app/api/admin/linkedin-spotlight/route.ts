import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { draftSpotlights } from "@/lib/linkedin-spotlight";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const MAX_DRAFTS = 9;

// Returns draft posts for review; scheduling happens separately through /api/admin/linkedin-posts.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await req.json().catch(() => ({}));
  const n = Math.min(MAX_DRAFTS, Math.max(1, Number(count) || 3));
  const drafts = await draftSpotlights(n);
  if (drafts.length === 0) {
    return NextResponse.json({ error: "Every job has already been posted. Add new jobs first." }, { status: 404 });
  }
  return NextResponse.json({ drafts });
}
