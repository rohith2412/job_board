import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { draftDailyPlan, type SlotType } from "@/lib/linkedin-spotlight";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const MAX_DRAFTS = 15;
const SLOT_TYPES: SlotType[] = ["spotlight", "roundup", "rotating"];

// Returns one draft per requested slot for review; scheduling happens separately through /api/admin/linkedin-posts.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slots } = await req.json().catch(() => ({}));
  const valid = (Array.isArray(slots) ? slots : [])
    .filter((s) => s && SLOT_TYPES.includes(s.type) && !Number.isNaN(new Date(s.when).getTime()))
    .slice(0, MAX_DRAFTS)
    .map((s) => ({ when: new Date(s.when).toISOString(), type: s.type as SlotType }));
  if (valid.length === 0) {
    return NextResponse.json({ error: "Add at least one posting time" }, { status: 400 });
  }

  const drafts = await draftDailyPlan(valid);
  if (drafts.length === 0) {
    return NextResponse.json({ error: "Nothing new to post. Add new jobs first." }, { status: 404 });
  }
  return NextResponse.json({ drafts });
}
