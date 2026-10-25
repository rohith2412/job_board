import type { Metadata } from "next";
import Link from "next/link";
import { getAllFeaturedJobs } from "@/lib/data";
import { slugifyCompany } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Companies Hiring in USA & Canada | Reblet",
  description:
    "Explore top tech companies hiring software engineers in the United States and Canada. Browse open positions at PolicyMe, Kepler Communications, Greenhouse, Maple, Lever and more.",
  openGraph: {
    title: "Companies Hiring Software Engineers in USA & Canada",
    description:
      "Explore top tech companies hiring software engineers in the USA and Canada.",
    type: "website",
    url: "https://www.reblet.com/companies",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/companies",
  },
};

export default async function CompaniesPage() {
  const jobs = await getAllFeaturedJobs();

  const companyMap = new Map<
    string,
    { count: number; locations: Set<string> }
  >();

  for (const job of jobs) {
    const existing = companyMap.get(job.company) || {
      count: 0,
      locations: new Set<string>(),
    };
    existing.count++;
    if (job.location) existing.locations.add(job.location);
    companyMap.set(job.company, existing);
  }

  const companies = Array.from(companyMap.entries())
    .map(([name, data]) => ({
      name,
      slug: slugifyCompany(name),
      count: data.count,
      locations: Array.from(data.locations),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="px-6 py-8 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Companies
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length} companies hiring right now
          </p>
        </div>

        <div className="flex-1 px-6 py-6 flex flex-col gap-3">
          {companies.map((company) => (
            <Link
              key={company.slug}
              href={`/companies/${company.slug}`}
              className="flex items-center justify-between p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {company.name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {company.locations.join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">
                  {company.count} {company.count === 1 ? "role" : "roles"}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
