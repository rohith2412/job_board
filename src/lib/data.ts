import { cacheLife } from "next/cache";
import { connectDB } from "./mongodb";
import { SavedJob } from "@/models/SavedJob";
import { Company } from "@/models/Company";

export async function getJobBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const job = await SavedJob.findOne({ slug, featured: true }).lean();
  if (!job) return null;
  return JSON.parse(JSON.stringify(job));
}

export async function getAllFeaturedJobs() {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const jobs = await SavedJob.find({ featured: true })
    .sort({ company: 1, title: 1 })
    .lean();
  return JSON.parse(JSON.stringify(jobs));
}

export async function getCompanyLogo(companyName: string): Promise<string> {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const company = await Company.findOne({ name: companyName }).select("logo").lean();
  return (company as any)?.logo || "";
}

export async function getCompanyLogos(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const companies = await Company.find({ logo: { $ne: "" } })
    .select("name logo")
    .lean();
  const map: Record<string, string> = {};
  for (const c of companies) {
    map[(c as any).name] = (c as any).logo;
  }
  return JSON.parse(JSON.stringify(map));
}

export async function getAdjacentJobs(slug: string) {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const allSlugs = await SavedJob.find({ featured: true })
    .sort({ createdAt: -1 })
    .select("slug title")
    .lean();
  const idx = allSlugs.findIndex((j) => j.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  const prev = idx > 0 ? { slug: allSlugs[idx - 1].slug, title: allSlugs[idx - 1].title } : null;
  const next = idx < allSlugs.length - 1 ? { slug: allSlugs[idx + 1].slug, title: allSlugs[idx + 1].title } : null;
  return JSON.parse(JSON.stringify({ prev, next }));
}
