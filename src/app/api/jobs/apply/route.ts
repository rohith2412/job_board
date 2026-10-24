import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";
import { Application } from "@/models/Application";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to apply" }, { status: 401 });
  }

  const formData = await req.formData();
  const jobSlug = formData.get("jobSlug") as string;
  const note = (formData.get("note") as string) || "";
  const resume = formData.get("resume") as File | null;

  if (!jobSlug) {
    return NextResponse.json({ error: "Job slug required" }, { status: 400 });
  }

  await connectDB();

  const job = await SavedJob.findOne({ slug: jobSlug }).lean();
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existing = await Application.findOne({
    jobSlug,
    applicantEmail: session.user.email,
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already applied to this job" },
      { status: 400 }
    );
  }

  let resumeUrl = "";
  if (resume && resume.size > 0) {
    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume too large (max 5MB)" }, { status: 400 });
    }
    try {
      const ext = resume.name.split(".").pop() || "pdf";
      const key = `resumes/${jobSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await resume.arrayBuffer());
      resumeUrl = await uploadToR2(key, buffer, resume.type);
    } catch (err) {
      return NextResponse.json(
        { error: `Resume upload failed: ${err instanceof Error ? err.message : "unknown error"}` },
        { status: 500 }
      );
    }
  }

  try {
    const application = await Application.create({
      jobSlug,
      jobTitle: (job as any).title,
      companyEmail: (job as any).postedByEmail || "",
      applicantName: session.user.name || "",
      applicantEmail: session.user.email,
      resumeUrl,
      note,
    });

    return NextResponse.json({
      success: true,
      application: JSON.parse(JSON.stringify(application)),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to save application: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 500 }
    );
  }
}
