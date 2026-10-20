import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const job = await req.json();
    const slug = toSlug(job.title) + "-" + Date.now().toString(36);

    await connectDB();

    const saved = await SavedJob.findOneAndUpdate(
      { slug },
      { slug, ...job },
      { upsert: true, new: true }
    );

    return NextResponse.json({ slug: saved.slug });
  } catch {
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 });
  }
}
