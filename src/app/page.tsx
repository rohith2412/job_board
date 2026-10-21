import type { Metadata } from "next";
import Link from "next/link";
import { getAllFeaturedJobs } from "@/lib/data";
import { slugifyCompany } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reblet | Curated Software Engineering Jobs in USA & Canada",
  description:
    "Discover handpicked software engineering jobs at top tech companies in the United States and Canada. Browse roles by company, view salaries, and apply directly.",
  openGraph: {
    title: "Reblet | Curated Software Engineering Jobs in USA & Canada",
    description:
      "Discover handpicked software engineering jobs at top tech companies in the USA and Canada.",
    type: "website",
    url: "https://www.reblet.com",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com",
  },
};

export default async function Home() {
  const jobs = await getAllFeaturedJobs();
  const companies = [
    ...new Set(jobs.map((j: { company: string }) => j.company)),
  ].sort() as string[];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col justify-center px-6 py-16">
          <div className="flex flex-col gap-6 mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              Curated software
              <br />
              engineering jobs
              <br />
              <span className="text-gray-400">in USA & Canada</span>
            </h1>
            <p className="text-base text-gray-500 max-w-md">
              Handpicked roles at top companies across the US and Canada. No
              spam, no duplicates - just jobs worth applying to.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Link
              href="/jobs"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold text-black border-2 border-black transition-all hover:brightness-95 active:translate-y-0.5 active:shadow-none"
              style={{
                backgroundColor: "#6fde8a",
                boxShadow: "0 3px 0 0 #000",
              }}
            >
              Browse All Jobs
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/companies"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-medium text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              View Companies
            </Link>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Hiring now
            </p>
            <div className="flex flex-wrap gap-2">
              {companies.map((company: string) => (
                <Link
                  key={company}
                  href={`/companies/${slugifyCompany(company)}`}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {company}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-6 py-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            {jobs.length} jobs · {companies.length} companies · Updated daily
          </p>
        </footer>
      </div>
    </main>
  );
}
