import type { Metadata } from "next";
import { getPaginatedFeaturedJobs, getFeaturedJobsCount, getJobFilterOptions, getCompanyLogos, getJobPosters, type JobFilters } from "@/lib/data";
import { cleanSnippet } from "@/lib/utils";
import JobsFilter from "@/components/JobsFilter";

export const instant = false;

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
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const pageSize = 10;
  const requestedPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const filters: JobFilters = {};
  if (params.q) filters.search = params.q;
  if (params.location) filters.location = params.location;
  if (params.company) filters.company = params.company;
  if (params.type) filters.experienceType = params.type;
  if (params.remote === "true") filters.remote = true;
  if (params.date) {
    const d = parseInt(params.date, 10);
    if (d > 0) filters.dateDays = d;
  }

  const hasFilters = Object.keys(filters).length > 0;

  const [totalCount, logoMap, filterOptions] = await Promise.all([
    getFeaturedJobsCount(filters),
    getCompanyLogos(),
    getJobFilterOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const jobs = await getPaginatedFeaturedJobs(currentPage, pageSize, filters);

  const posterEmails = (jobs as any[])
    .map((j: any) => j.postedByEmail)
    .filter((e: string) => e);
  const posterMap = await getJobPosters([...new Set(posterEmails)]);

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
      postedByEmail?: string;
    }) => {
      const poster = job.postedByEmail ? posterMap[job.postedByEmail] : undefined;
      return {
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
        postedByName: poster?.name || "",
        postedByImage: poster?.image || "",
      };
    }
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
          hasFilters={hasFilters}
        />
      </div>
    </main>
  );
}
