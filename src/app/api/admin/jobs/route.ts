import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const jobs = await SavedJob.find({})
    .sort({ createdAt: -1 })
    .select("slug title company location experienceType featured createdAt")
    .lean();

  return NextResponse.json({ jobs: JSON.parse(JSON.stringify(jobs)) });
}
