import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";
import { SavedJob } from "@/models/SavedJob";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const company = await Company.findOne({ userEmail: session.user.email }).lean();
  if (!company) {
    return NextResponse.json(
      { error: "Create a company profile first" },
      { status: 400 }
    );
  }

  const { title, description, location, salary, experienceType, applyUrl } =
    await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 });
  }

  const baseSlug = slugify(`${(company as any).name}-${title}`);
  const ts = Date.now().toString(36);
  const slug = `${baseSlug}-${ts}`;

  const link = applyUrl?.trim() || `https://reblet.com/jobs/${slug}`;

  const job = await SavedJob.create({
    slug,
    title: title.trim(),
    company: (company as any).name,
    location: location?.trim() || (company as any).location || "",
    snippet: description.trim().slice(0, 300),
    link,
    salary: salary?.trim() || "",
    source: "company",
    featured: true,
    experienceType: experienceType || "Full-time",
    description: description.trim(),
    applyUrl: applyUrl?.trim() || "",
    postedByEmail: session.user.email,
  });

  revalidatePath("/jobs");
  revalidatePath("/");

  return NextResponse.json({ job: JSON.parse(JSON.stringify(job)) });
}
