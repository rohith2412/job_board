import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { LinkedInPost, POST_KINDS } from "@/models/LinkedInPost";
import { LINKEDIN_MAX_CHARS } from "@/lib/linkedin";

// Returns an error message, or null when the requested content/schedule is acceptable.
function validate(content: unknown, status: unknown, scheduledFor: unknown) {
  if (typeof content === "string" && content.length > LINKEDIN_MAX_CHARS) {
    return `Post is ${content.length} characters; LinkedIn allows ${LINKEDIN_MAX_CHARS}`;
  }
  if (status === "scheduled") {
    const when = new Date(String(scheduledFor ?? ""));
    if (!scheduledFor || Number.isNaN(when.getTime())) return "Pick a date and time to schedule";
    if (when.getTime() < Date.now() - 60_000) return "Scheduled time must be in the future";
  }
  if (status !== undefined && !["draft", "scheduled", "posted"].includes(String(status))) {
    return "Invalid status";
  }
  return null;
}

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const posts = await LinkedInPost.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    posts: JSON.parse(JSON.stringify(posts)),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, profile, status, jobSlugs, scheduledFor, kind, ref } =
    await req.json();

  if (!content || !profile) {
    return NextResponse.json(
      { error: "Content and profile are required" },
      { status: 400 }
    );
  }
  const invalid = validate(content, status, scheduledFor);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  await connectDB();
  const post = await LinkedInPost.create({
    content,
    profile,
    status: status || "draft",
    jobSlugs: jobSlugs || [],
    ...(POST_KINDS.includes(kind) ? { kind } : {}),
    ...(typeof ref === "string" && ref ? { ref: ref.slice(0, 200) } : {}),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
  });

  return NextResponse.json({
    success: true,
    post: JSON.parse(JSON.stringify(post)),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, content, status, profile, scheduledFor } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }
  const invalid = validate(content, status, scheduledFor);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  await connectDB();

  const update: Record<string, unknown> = {};
  if (content !== undefined) update.content = content;
  if (status !== undefined) update.status = status;
  if (profile !== undefined) update.profile = profile;
  if (scheduledFor !== undefined)
    update.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  if (status === "posted") update.postedAt = new Date();
  if (status !== undefined) update.lastError = null;

  const post = await LinkedInPost.findByIdAndUpdate(id, update, { new: true });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    post: JSON.parse(JSON.stringify(post)),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  await connectDB();
  await LinkedInPost.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
