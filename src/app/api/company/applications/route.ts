import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";
import { Application } from "@/models/Application";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const jobs = await SavedJob.find({ postedByEmail: session.user.email })
    .select("slug")
    .lean();
  const slugs = jobs.map((j) => (j as any).slug);

  const applications = await Application.find({
    jobSlug: { $in: slugs },
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    applications: JSON.parse(JSON.stringify(applications)),
  });
}
