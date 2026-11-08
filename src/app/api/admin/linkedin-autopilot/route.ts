import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAutopilot, runAutopilot, saveAutopilot, type AutopilotSlot } from "@/lib/linkedin-autopilot";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const SLOT_TYPES = ["spotlight", "roundup", "rotating"];

export const maxDuration = 300;

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.email === ADMIN_EMAIL;
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAutopilot());
}

// Saves the daily plan; when autopilot is on, fills any empty slots in the next two days right away.
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slots: AutopilotSlot[] = (Array.isArray(body.slots) ? body.slots : [])
    .filter((s: AutopilotSlot) => /^\d{2}:\d{2}$/.test(s?.time) && SLOT_TYPES.includes(s?.type))
    .slice(0, 8);
  let timezone = "America/Toronto";
  try {
    if (typeof body.timezone === "string") {
      new Intl.DateTimeFormat("en-US", { timeZone: body.timezone });
      timezone = body.timezone;
    }
  } catch {}
  if (body.enabled && !slots.length) return NextResponse.json({ error: "Add at least one posting time" }, { status: 400 });

  await saveAutopilot({ enabled: Boolean(body.enabled), slots, timezone });
  const run = body.enabled ? await runAutopilot({ force: true }) : null;
  return NextResponse.json({ ...(await getAutopilot()), run });
}
