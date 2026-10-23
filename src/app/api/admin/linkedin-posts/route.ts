import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { LinkedInPost } from "@/models/LinkedInPost";

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

  const { content, profile, status, jobSlugs, scheduledFor } =
    await req.json();

  if (!content || !profile) {
    return NextResponse.json(
      { error: "Content and profile are required" },
      { status: 400 }
    );
  }

  await connectDB();
  const post = await LinkedInPost.create({
    content,
    profile,
    status: status || "draft",
    jobSlugs: jobSlugs || [],
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

  await connectDB();

  const update: Record<string, unknown> = {};
  if (content !== undefined) update.content = content;
  if (status !== undefined) update.status = status;
  if (profile !== undefined) update.profile = profile;
  if (scheduledFor !== undefined)
    update.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  if (status === "posted") update.postedAt = new Date();

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
