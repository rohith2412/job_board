import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { approveCandidates, backfillFeedJobs, getAutoAdd, rejectCandidates, setAutoAdd, syncFeeds } from "@/lib/job-review";
import { JobCandidate } from "@/models/JobCandidate";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export const maxDuration = 300;

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.email === ADMIN_EMAIL;
}

// Pending roles found in company feeds, newest first.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const [candidates, approved, rejected, last, autoAdd] = await Promise.all([
    JobCandidate.find({ status: "pending", closed: false })
      .sort({ firstSeenAt: -1 })
      .limit(500)
      .select("ats company title location applyUrl salary postedAt firstSeenAt description")
      .lean(),
    JobCandidate.countDocuments({ status: "approved" }),
    JobCandidate.countDocuments({ status: "rejected" }),
    JobCandidate.findOne({}).sort({ lastSeenAt: -1 }).select("lastSeenAt").lean(),
    getAutoAdd(),
  ]);
  return NextResponse.json({
    candidates: (candidates as unknown as { description?: string }[]).map((c) => ({ ...c, description: (c.description ?? "").slice(0, 700) })),
    approved,
    rejected,
    lastCheckedAt: (last as { lastSeenAt?: Date } | null)?.lastSeenAt ?? null,
    autoAdd,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, ids, enabled } = await req.json().catch(() => ({}));
  const list = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0, 50) : [];

  if (action === "sync") return NextResponse.json(await syncFeeds());
  if (action === "auto-add") return NextResponse.json(await setAutoAdd(Boolean(enabled)));
  if (action === "backfill") return NextResponse.json(await backfillFeedJobs());
  if (!list.length) return NextResponse.json({ error: "Pick at least one job" }, { status: 400 });
  if (action === "approve") return NextResponse.json(await approveCandidates(list));
  if (action === "reject") return NextResponse.json(await rejectCandidates(list));
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
