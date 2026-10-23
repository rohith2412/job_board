import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobBySlug, getAllFeaturedJobs } from "@/lib/data";
import { cleanSnippet, formatSalary, slugifyCompany } from "@/lib/utils";
import JobAuthSection from "@/components/JobAuthSection";

export async function generateStaticParams() {
  const jobs = await getAllFeaturedJobs();
  return jobs.map((job: { slug: string }) => ({ id: job.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobBySlug(id);

  if (!job) {
    return { title: "Job Not Found | Reblet" };
  }

  const description = cleanSnippet(job.snippet).slice(0, 160);

  return {
    title: `${job.title} at ${job.company} | Reblet`,
    description,
    openGraph: {
      title: `${job.title} at ${job.company}`,
      description,
      type: "website",
      url: `https://www.reblet.com/jobs/${job.slug}`,
      siteName: "Reblet",
    },
    twitter: {
      card: "summary",
      title: `${job.title} at ${job.company}`,
      description,
    },
    alternates: {
      canonical: `https://www.reblet.com/jobs/${job.slug}`,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobBySlug(id);

  if (!job) {
    notFound();
  }

  const snippet = cleanSnippet(job.snippet);
  const companySlug = slugifyCompany(job.company);

  const locationParts = job.location?.split(",").map((s: string) => s.trim()) || [];
  const isRemote = job.location?.toLowerCase().includes("remote");

  const postedDate = job.createdAt
    ? new Date(job.createdAt).toISOString().split("T")[0]
    : undefined;

  const validThrough = job.createdAt
    ? new Date(new Date(job.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : undefined;

  const employmentTypeMap: Record<string, string> = {
    "Full-time": "FULL_TIME",
    "Internship": "INTERN",
    "Co-op": "INTERN",
    "Contract": "CONTRACTOR",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: snippet,
    datePosted: postedDate,
    validThrough,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: `https://www.reblet.com/companies/${companySlug}`,
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: locationParts[0] || job.location,
            addressRegion: locationParts[1] || "",
            addressCountry: job.location.includes("Canada") || job.location.includes(", ON") || job.location.includes(", BC") || job.location.includes(", QC") || job.location.includes(", AB") ? "CA" : "US",
          },
        }
      : undefined,
    ...(isRemote && {
      jobLocationType: "TELECOMMUTE",
    }),
    baseSalary: job.salary
      ? {
          "@type": "MonetaryAmount",
          currency: job.salary.includes("CAD") ? "CAD" : "USD",
          value: {
            "@type": "QuantitativeValue",
            value: job.salary,
            unitText: "YEAR",
          },
        }
      : undefined,
    employmentType: employmentTypeMap[job.experienceType] || "FULL_TIME",
    url: `https://www.reblet.com/jobs/${job.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
          <nav className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <Link
              href="/jobs"
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
              All Jobs
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/companies/${companySlug}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              {job.company}
            </Link>
          </nav>

          <div className="flex-1 px-6 py-8 flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
                  {job.source}
                </span>
                {job.location &&
                  job.location.toLowerCase().includes("remote") && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Remote
                    </span>
                  )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                {job.title}
              </h1>
            </div>

            <div className="flex flex-col gap-1">
              <Link
                href={`/companies/${companySlug}`}
                className="text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
              >
                {job.company}
              </Link>
              <div className="flex items-center gap-2">
                {job.location && (
                  <span className="text-sm text-gray-500">{job.location}</span>
                )}
                {job.createdAt && (
                  <>
                    {job.location && <span className="text-gray-300">·</span>}
                    <span className="text-sm text-gray-400">
                      Posted {(() => {
                        const now = new Date();
                        const posted = new Date(job.createdAt);
                        const diffMs = now.getTime() - posted.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);
                        if (diffMins < 60) return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
                        if (diffHours < 24) return `${diffHours}h ago`;
                        if (diffDays === 1) return "yesterday";
                        if (diffDays < 30) return `${diffDays}d ago`;
                        return posted.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      })()}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {job.salary && (
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  {formatSalary(job.salary)}
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {job.location}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <JobAuthSection snippet={snippet} link={job.link} />
          </div>
        </div>
      </main>
    </>
  );
}
