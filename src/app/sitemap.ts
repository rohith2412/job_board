import type { MetadataRoute } from "next";
import { getAllFeaturedJobs } from "@/lib/data";
import { slugifyCompany } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getAllFeaturedJobs();
  const companies = [
    ...new Set(jobs.map((j: { company: string }) => j.company)),
  ] as string[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://www.reblet.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.reblet.com/jobs",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.reblet.com/companies",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const jobPages: MetadataRoute.Sitemap = jobs.map(
    (job: { slug: string; createdAt?: string }) => ({
      url: `https://www.reblet.com/jobs/${job.slug}`,
      lastModified: job.createdAt ? new Date(job.createdAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  const companyPages: MetadataRoute.Sitemap = companies.map(
    (company: string) => ({
      url: `https://www.reblet.com/companies/${slugifyCompany(company)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...jobPages, ...companyPages];
}
