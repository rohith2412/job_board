"use client";

import { useSession, signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary: string;
  source: string;
  featured?: boolean;
}

function formatSalary(salary: string): string {
  return salary.replace(/[\d,]+/g, (match) =>
    Number(match.replace(/,/g, "")).toLocaleString()
  );
}

function cleanSnippet(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/\.\.\./g, "")
    .replace(/\r\n/g, "\n")
    .replace(/<b>/g, "")
    .replace(/<\/b>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <JobDetailContent />
    </Suspense>
  );
}

const AVAILABLE_SLUGS = new Set([
  "junior-software-engineer-at-policyme-lwtvywfi",
  "software-engineer-at-policyme-uguirhva",
  "senior-software-engineer-at-policyme-eww683sc",
  "embedded-software-designer-at-kepler-communications-ovk42co8",
  "software-engineering-intern-at-kepler-communications-74oy73e9",
  "software-engineer-at-greenhouse-software-ngm889w3",
  "senior-software-engineer-i-at-greenhouse-software-sa0kja8m",
  "staff-ai-engineer-at-maple-rn2qgq6d",
  "api-engineer-at-lever-hg5vaj0s",
  "product-engineer-at-lever-blmo1lv6",
]);

function JobDetailContent() {
  const { status } = useSession();
  const params = useParams();
  const slug = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/jobs/${slug}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.job) setJob(data.job);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 mb-2">Job not found</p>
          <Link href="/jobs" className="text-gray-500 hover:text-gray-800 text-sm">
            Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const isAuthenticated = status === "authenticated";

  if (!AVAILABLE_SLUGS.has(slug)) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
          <Link href="/jobs" className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 text-base font-medium text-gray-500 hover:text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Temporarily Not Available</h1>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              This job listing is not available right now. Please check back later or browse other opportunities.
            </p>
            <Link
              href="/jobs"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Browse Jobs
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
        <Link href="/jobs" className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 text-base font-medium text-gray-500 hover:text-gray-800">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        <div className="flex-1 px-6 py-8 flex flex-col gap-7">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-sm font-semibold px-4 py-1.5 rounded-full tracking-wide">
                {job.source}
              </span>
              {job.location && job.location.toLowerCase().includes("remote") && (
                <span className="text-sm text-gray-400">Remote</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
              {job.title}
            </h1>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold text-gray-800">{job.company}</span>
            {job.location && (
              <span className="text-sm text-gray-500">{job.location}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {job.salary && (
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                {formatSalary(job.salary)}
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {job.location}
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {isAuthenticated ? (
            <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-2xl">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">About this role</h2>
                <p className="text-base text-gray-500 leading-relaxed whitespace-pre-line">
                  {cleanSnippet(job.snippet)}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              <div className="flex flex-col gap-6 p-6 bg-gray-50 blur-sm select-none pointer-events-none">
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-semibold text-gray-800 tracking-tight">About this role</h2>
                  <p className="text-base text-gray-500 leading-relaxed whitespace-pre-line">
                    {cleanSnippet(job.snippet)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="pb-24" />

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 z-50">
            <div className="mx-auto max-w-2xl">
              {isAuthenticated ? (
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-full transition-all text-black text-lg font-semibold border-2 border-black hover:brightness-95 active:translate-y-1 active:shadow-none"
                  style={{ backgroundColor: "#6fde8a", boxShadow: "0 4px 0 0 #000" }}
                >
                  Apply
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                  </svg>
                </a>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-full transition-all text-black text-lg font-semibold border-2 border-black hover:brightness-95 active:translate-y-1 active:shadow-none cursor-pointer"
                  style={{ backgroundColor: "#6fde8a", boxShadow: "0 4px 0 0 #000" }}
                >
                  Sign in to Apply
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
