import { cacheLife } from "next/cache";
import { connectDB } from "./mongodb";
import { SavedJob } from "@/models/SavedJob";

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
