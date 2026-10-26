import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobBySlug, getAllFeaturedJobs, getAdjacentJobs, getCompanyLogo } from "@/lib/data";
import { cleanSnippet, formatSalary, slugifyCompany } from "@/lib/utils";
import PostedTime from "@/components/PostedTime";
import ApplyButton from "@/components/ApplyButton";
import JobDescription from "@/components/JobDescription";

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

  const [snippet, adjacent, companyLogo] = await Promise.all([
    Promise.resolve(cleanSnippet(job.snippet)),
    getAdjacentJobs(id),
    job.source === "company" ? getCompanyLogo(job.company) : Promise.resolve(""),
  ]);
  const companySlug = slugifyCompany(job.company);

  const locationParts = job.location?.split(",").map((s: string) => s.trim()) || [];
  const isRemote = job.location?.toLowerCase().includes("remote");

  const postedDate = job.createdAt
    ? new Date(job.createdAt).toISOString().split("T")[0]
    : "2026-10-25";

  const validThrough = job.createdAt
    ? new Date(new Date(job.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : "2027-01-23";

  const employmentTypeMap: Record<string, string> = {
    "Full-time": "FULL_TIME",
    "Internship": "INTERN",
    "Co-op": "INTERN",
    "Contract": "CONTRACTOR",
  };

  const canadianProvinces = ["ON", "BC", "QC", "AB", "MB", "SK", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];
  const isCanada =
    job.location?.includes("Canada") ||
    canadianProvinces.some((p) => job.location?.includes(`, ${p}`));

  const parseSalary = (salary: string) => {
    const nums = salary.match(/[\d,]+\.?\d*/g)?.map((n) => parseFloat(n.replace(/,/g, ""))) || [];
    let unitText = "YEAR";
    if (/\/hr|per hour|hourly/i.test(salary)) unitText = "HOUR";
    else if (/\/mo|per month|monthly/i.test(salary)) unitText = "MONTH";
    else if (/\/wk|per week|weekly/i.test(salary)) unitText = "WEEK";
    if (nums.length >= 2) {
      return { minValue: nums[0], maxValue: nums[1], unitText };
    }
    if (nums.length === 1) {
      return { value: nums[0], unitText };
    }
    return { value: salary, unitText };
  };

  const salaryData = job.salary ? parseSalary(job.salary) : null;

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
            addressRegion: locationParts.length > 1 ? locationParts[1] : "",
            addressCountry: isCanada ? "CA" : "US",
          },
        }
      : undefined,
    ...(isRemote && {
      jobLocationType: "TELECOMMUTE",
    }),
    baseSalary: salaryData
      ? {
          "@type": "MonetaryAmount",
          currency: job.salary?.includes("CAD") ? "CAD" : "USD",
          value: {
            "@type": "QuantitativeValue",
            ...salaryData,
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
      <main className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-2xl px-6 overflow-hidden">
          <nav className="flex items-center gap-3 py-5 relative z-10">
            <Link
              href="/jobs"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
              All Jobs
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/companies/${companySlug}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors truncate"
            >
              {job.company}
            </Link>
          </nav>

          <div className="py-6 sm:py-10">
            <div className="w-full flex flex-col gap-5">
              {/* Desktop: arrows + card side by side. Mobile: card full width */}
              <div className="w-full flex items-center gap-3">
                {/* Left arrow — hidden on mobile */}
                {adjacent.prev ? (
                  <Link
                    href={`/jobs/${adjacent.prev.slug}`}
                    className="hidden sm:flex shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-400 hover:text-gray-800 hover:border-gray-400 transition-colors"
                    title={adjacent.prev.title}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </Link>
                ) : (
                  <div className="hidden sm:block shrink-0 w-10 h-10" />
                )}

                {/* Card */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-12 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    {companyLogo && (
                      <img
                        src={companyLogo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <Link
                        href={`/companies/${companySlug}`}
                        className="text-base font-semibold text-gray-700 hover:text-gray-500 transition-colors"
                      >
                        {job.company}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mt-1">
                        {job.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.createdAt && <PostedTime date={job.createdAt} />}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight break-words">
                    {job.title}
                  </h1>

                  {job.salary && (
                    <span className="text-base text-gray-500 font-medium">{formatSalary(job.salary)}</span>
                  )}

                  {job.description && (
                    <JobDescription text={job.description} />
                  )}

                  {job.source === "company" && !job.applyUrl ? (
                    <ApplyButton slug={job.slug} />
                  ) : (
                    <a
                      href={job.applyUrl || job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-3 w-full py-3 sm:py-4 rounded-full transition-all text-black text-base sm:text-lg font-semibold border-2 border-black bg-green-300 shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                    >
                      Apply
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Right arrow — hidden on mobile */}
                {adjacent.next ? (
                  <Link
                    href={`/jobs/${adjacent.next.slug}`}
                    className="hidden sm:flex shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-400 hover:text-gray-800 hover:border-gray-400 transition-colors"
                    title={adjacent.next.title}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ) : (
                  <div className="hidden sm:block shrink-0 w-10 h-10" />
                )}
              </div>

              {/* Mobile nav arrows — below card */}
              <div className="flex sm:hidden items-center justify-center gap-4">
                {adjacent.prev ? (
                  <Link
                    href={`/jobs/${adjacent.prev.slug}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Prev
                  </Link>
                ) : (
                  <div className="w-24" />
                )}
                {adjacent.next ? (
                  <Link
                    href={`/jobs/${adjacent.next.slug}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ) : (
                  <div className="w-24" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
