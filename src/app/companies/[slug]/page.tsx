import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllFeaturedJobs } from "@/lib/data";
import { cleanSnippet, formatSalary, slugifyCompany } from "@/lib/utils";

export async function generateStaticParams() {
  const jobs = await getAllFeaturedJobs();
  const companies = [
    ...new Set(jobs.map((j: { company: string }) => j.company)),
  ] as string[];
  return companies.map((c) => ({ slug: slugifyCompany(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jobs = await getAllFeaturedJobs();

  const companyName = jobs.find(
    (j: { company: string }) => slugifyCompany(j.company) === slug
  )?.company;

  if (!companyName) {
    return { title: "Company Not Found | Reblet" };
  }

  return {
    title: `${companyName} Jobs | Reblet`,
    description: `Browse open software engineering positions at ${companyName} in the USA and Canada. View roles, salaries, and apply directly.`,
    openGraph: {
      title: `Jobs at ${companyName}`,
      description: `Browse open software engineering positions at ${companyName} in the USA and Canada.`,
      type: "website",
      url: `https://www.reblet.com/companies/${slug}`,
      siteName: "Reblet",
    },
    alternates: {
      canonical: `https://www.reblet.com/companies/${slug}`,
    },
  };
}

interface Job {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  snippet: string;
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const allJobs = await getAllFeaturedJobs();

  const companyJobs = allJobs.filter(
    (j: Job) => slugifyCompany(j.company) === slug
  );

  if (companyJobs.length === 0) {
    notFound();
  }

  const companyName = companyJobs[0].company;
  const locations = [
    ...new Set(
      companyJobs.map((j: Job) => j.location).filter(Boolean) as string[]
    ),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: companyName,
    url: `https://www.reblet.com/companies/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
          <nav className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <Link
              href="/companies"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Companies
            </Link>
          </nav>

          <div className="px-6 py-8 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {companyName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {locations.join(" · ")} · {companyJobs.length}{" "}
              {companyJobs.length === 1 ? "open role" : "open roles"}
            </p>
          </div>

          <div className="flex-1 px-6 py-6 flex flex-col gap-3">
            {companyJobs.map((job: Job) => (
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
                    <p className="text-sm text-gray-500">{job.location}</p>
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
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
