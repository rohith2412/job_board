import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    .sort({ createdAt: -1 })
    .lean();

  const slugs = jobs.map((j) => (j as any).slug);
  const appCounts = await Application.aggregate([
    { $match: { jobSlug: { $in: slugs } } },
    { $group: { _id: "$jobSlug", count: { $sum: 1 } } },
  ]);

  const countMap: Record<string, number> = {};
  for (const a of appCounts) {
    countMap[a._id] = a.count;
  }

  const jobsWithCounts = jobs.map((j) => ({
    ...JSON.parse(JSON.stringify(j)),
    applicationCount: countMap[(j as any).slug] || 0,
  }));

  return NextResponse.json({ jobs: jobsWithCounts });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, title, description, location, salary, experienceType, applyUrl, featured } =
    await req.json();

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  await connectDB();

  const job = await SavedJob.findOne({ slug, postedByEmail: session.user.email });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (title !== undefined) job.title = title;
  if (description !== undefined) {
    job.description = description;
    job.snippet = description.slice(0, 300);
  }
  if (location !== undefined) job.location = location;
  if (salary !== undefined) job.salary = salary;
  if (experienceType !== undefined) job.experienceType = experienceType;
  if (applyUrl !== undefined) job.applyUrl = applyUrl;
  if (featured !== undefined) job.featured = featured;

  await job.save();

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/");

  return NextResponse.json({ job: JSON.parse(JSON.stringify(job)) });
}
