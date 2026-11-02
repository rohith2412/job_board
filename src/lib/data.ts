import { cacheLife } from "next/cache";
import { connectDB } from "./mongodb";
import { SavedJob } from "@/models/SavedJob";
import { Company } from "@/models/Company";
import { User } from "@/models/User";

export interface JobFilters {
  search?: string;
  location?: string;
  company?: string;
  experienceType?: string;
  remote?: boolean;
  dateDays?: number;
}

function buildFilterQuery(filters: JobFilters) {
  const query: any = { featured: true };

  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { company: { $regex: escaped, $options: "i" } },
    ];
  }

  if (filters.location) {
    if (filters.location.startsWith("^")) {
      query.location = { $regex: filters.location, $options: "i" };
    } else {
      query.location = filters.location;
    }
  } else if (filters.remote) {
    query.location = { $regex: /remote/i };
  }

  if (filters.company) {
    query.company = filters.company;
  }

  if (filters.experienceType) {
    query.experienceType = filters.experienceType;
  }

  if (filters.dateDays) {
    const cutoff = new Date(Date.now() - filters.dateDays * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoff };
  }

  return query;
}

export async function getJobBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  await connectDB();
  const job = await SavedJob.findOne({ slug, featured: true }).lean();
  if (!job) return null;
  return JSON.parse(JSON.stringify(job));
}

export async function getAllFeaturedJobs() {
  "use cache";
  cacheLife("minutes");
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

export async function getPaginatedFeaturedJobs(page: number, pageSize: number, filters: JobFilters = {}) {
  "use cache";
  cacheLife("minutes");
  await connectDB();
  const query = buildFilterQuery(filters);
  const jobs = await SavedJob.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  return JSON.parse(JSON.stringify(jobs));
}

export async function getFeaturedJobsCount(filters: JobFilters = {}) {
  "use cache";
  cacheLife("minutes");
  await connectDB();
  const query = buildFilterQuery(filters);
  return SavedJob.countDocuments(query);
}

export async function getJobFilterOptions() {
  "use cache";
  cacheLife("hours");
  await connectDB();
  const [locations, companies, types] = await Promise.all([
    SavedJob.distinct("location", { featured: true }),
    SavedJob.distinct("company", { featured: true }),
    SavedJob.distinct("experienceType", { featured: true }),
  ]);
  return JSON.parse(JSON.stringify({
    locations: (locations as string[]).filter((l) => l && !l.toLowerCase().includes("remote")).sort(),
    companies: (companies as string[]).sort(),
    types: (types as string[]).filter(Boolean).sort(),
  }));
}

export async function getJobPosters(emails: string[]): Promise<Record<string, { name: string; image: string }>> {
  "use cache";
  cacheLife("minutes");
  if (emails.length === 0) return {};
  await connectDB();
  const users = await User.find({ email: { $in: emails } }).select("email name image").lean();
  const map: Record<string, { name: string; image: string }> = {};
  for (const u of users) {
    map[(u as any).email] = { name: (u as any).name, image: (u as any).image || "" };
  }
  return JSON.parse(JSON.stringify(map));
}

export async function getAdjacentJobs(slug: string) {
  "use cache";
  cacheLife("minutes");
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
