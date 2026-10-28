import type { Metadata } from "next";
import Link from "next/link";
import { getAllFeaturedJobs } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reblet | SWE Internship & New Grad Job Openings Daily",
  description:
    "Sharing SWE internship & new grad job openings daily. Browse roles by company, view salaries, and apply directly.",
  openGraph: {
    title: "Reblet | SWE Internship & New Grad Job Openings Daily",
    description:
      "Sharing SWE internship & new grad job openings daily.",
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

  const previewJobs = jobs.slice(0, 4) as {
    slug: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    experienceType?: string;
  }[];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-14 sm:pt-20 pb-20">
        <p className="text-sm font-medium text-gray-500 mb-5 tracking-wide text-center">
          {jobs.length} open roles · updated daily
        </p>

        <h1 className="text-[2.5rem] sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5 text-center">
          SWE internship &<br />
          new grad jobs,<br />
          <span className="text-gray-400">every single day</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 text-center">
          We find the roles. You skip the noise and apply.
        </p>

        <Link
          href="/jobs"
          className="flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-black border-2 border-black transition-all hover:brightness-95 active:translate-y-0.5 active:shadow-none"
          style={{
            backgroundColor: "#6fde8a",
            boxShadow: "0 4px 0 0 #000",
          }}
        >
          Browse jobs
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/api/auth/signin"
          className="flex items-center justify-center gap-1.5 px-6 py-2 mt-3 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign in for free
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </section>

      {/* Job preview — show real listings */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-lg shadow-gray-200/60">
          {/* Safari-style title bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-white/80 border border-gray-200 text-xs text-gray-500 max-w-[280px] w-full justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="truncate">reblet.com/jobs</span>
              </div>
            </div>
            <Link href="/jobs" className="text-xs font-medium text-green-600 hover:text-green-700 flex-shrink-0">
              View all →
            </Link>
          </div>
          {/* Job listings */}
          <div className="divide-y divide-gray-100 bg-white">
            {previewJobs.map((job) => (
              <Link
                key={job.slug}
                href={`/jobs/${job.slug}`}
                className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {job.company} · {job.location}
                  </p>
                </div>
                {job.salary && (
                  <span className="flex-shrink-0 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                    {job.salary}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why reblet */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">New roles daily</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Fresh internship and new grad listings added every day — see them before they hit the big boards.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Salary transparency</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pay ranges shown when available so you know what to expect before clicking apply.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Email alerts</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Set your keywords, get 5 matched jobs in your inbox every morning. No account needed to browse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Stop doomscrolling LinkedIn
          </h2>
          <p className="text-gray-500 mb-8">
            We already found the jobs. You just need to apply.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-black border-2 border-black transition-all hover:brightness-95 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "#6fde8a",
              boxShadow: "0 4px 0 0 #000",
            }}
          >
            Browse jobs
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
