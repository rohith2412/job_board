import type { Metadata } from "next";
import { getPaginatedFeaturedJobs, getFeaturedJobsCount, getJobFilterOptions, getCompanyLogos } from "@/lib/data";
import { cleanSnippet } from "@/lib/utils";
import JobsFilter from "@/components/JobsFilter";

export const metadata: Metadata = {
  title: "Software Engineering Jobs in USA & Canada | Reblet",
  description:
    "Browse curated software engineering jobs at top tech companies in the United States and Canada. Find roles at PolicyMe, Kepler Communications, Greenhouse, Maple, Lever and more.",
  openGraph: {
    title: "Software Engineering Jobs in USA & Canada",
    description:
      "Browse curated software engineering jobs at top tech companies in the USA and Canada.",
    type: "website",
    url: "https://www.reblet.com/jobs",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/jobs",
  },
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const pageSize = 10;
  const requestedPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const [totalCount, logoMap, filterOptions] = await Promise.all([
    getFeaturedJobsCount(),
    getCompanyLogos(),
    getJobFilterOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const jobs = await getPaginatedFeaturedJobs(currentPage, pageSize);

  const serialized = jobs.map(
    (job: {
      slug: string;
      title: string;
      company: string;
      location: string;
      salary: string;
      snippet: string;
      link: string;
      experienceType?: string;
      createdAt?: string;
      source?: string;
      description?: string;
      applyUrl?: string;
    }) => ({
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location || "",
      salary: job.salary || "",
      snippet: cleanSnippet(job.snippet).slice(0, 120),
      link: job.link || "",
      experienceType: job.experienceType || (job.title.toLowerCase().includes("intern") ? "Internship" : "Full-time"),
      createdAt: job.createdAt || "2024-01-01T00:00:00.000Z",
      source: job.source || "",
      description: job.description || "",
      applyUrl: job.applyUrl || "",
      logo: job.source === "company" ? (logoMap[job.company] || "") : "",
    })
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <JobsFilter
          jobs={serialized}
          locations={filterOptions.locations}
          companies={filterOptions.companies}
          experienceTypes={filterOptions.types}
          currentPage={currentPage}
          totalPages={totalPages}
          totalJobs={totalCount}
        />
      </div>
    </main>
  );
}
