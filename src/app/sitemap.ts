import type { MetadataRoute } from "next";
import { getAllFeaturedJobs, getJobFilterOptions } from "@/lib/data";
import { slugifyCompany } from "@/lib/utils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, filterOptions] = await Promise.all([
    getAllFeaturedJobs(),
    getJobFilterOptions(),
  ]);

  const companies = [
    ...new Set(jobs.map((j: { company: string }) => j.company)),
  ] as string[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://www.reblet.com",
      lastModified: new Date(),
      changeFrequency: "daily",
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
    {
      url: "https://www.reblet.com/jobs/internships",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.reblet.com/jobs/new-grad",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.reblet.com/jobs/remote",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://www.reblet.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://www.reblet.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: "https://www.reblet.com/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
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

  const locationPages: MetadataRoute.Sitemap = filterOptions.locations
    .slice(0, 50)
    .map((location: string) => ({
      url: `https://www.reblet.com/jobs/in/${slugify(location)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...jobPages, ...companyPages, ...locationPages];
}
