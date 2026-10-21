import type { Metadata } from "next";
import Link from "next/link";
import { getAllFeaturedJobs } from "@/lib/data";
import { cleanSnippet, formatSalary, slugifyCompany } from "@/lib/utils";

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

export default async function JobsPage() {
  const jobs = await getAllFeaturedJobs();

  const grouped = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const existing = grouped.get(job.company) || [];
    existing.push(job);
    grouped.set(job.company, existing);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
        <div className="px-6 py-8 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            All Jobs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {jobs.length} curated positions at {grouped.size} companies
          </p>
        </div>

        <div className="flex-1 px-6 py-6 flex flex-col gap-10">
          {Array.from(grouped.entries()).map(([company, companyJobs]) => {
            const companySlug = slugifyCompany(company);
            return (
              <section key={company}>
                <div className="flex items-center justify-between mb-4">
                  <Link
                    href={`/companies/${companySlug}`}
                    className="text-base font-semibold text-gray-800 hover:text-gray-600 transition-colors"
                  >
                    {company}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {companyJobs.length}{" "}
                    {companyJobs.length === 1 ? "role" : "roles"}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {companyJobs.map(
                    (job: {
                      slug: string;
                      title: string;
                      location: string;
                      salary: string;
                      snippet: string;
                    }) => (
                      <Link
                        key={job.slug}
                        href={`/jobs/${job.slug}`}
                        className="block p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {job.location}
                            </p>
                          </div>
                          {job.salary && (
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                              {formatSalary(job.salary)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                          {cleanSnippet(job.snippet).slice(0, 120)}...
                        </p>
                      </Link>
                    )
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
