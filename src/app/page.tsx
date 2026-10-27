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

  const recentJobs = jobs.slice(0, 6) as {
    slug: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
  }[];

  const allCompanies = [
    ...new Set(jobs.map((j: { company: string }) => j.company)),
  ].sort() as string[];
  const totalCompanies = allCompanies.length;
  const topCompanies = allCompanies.slice(0, 18);

  return (
    <main className="min-h-screen bg-white">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          gap: 12px;
          animation: scroll 25s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-4">
          Sharing SWE internship
          <br />
          & new grad job
          <br />
          <span className="text-gray-400">openings daily</span>
        </h1>

        <p className="text-gray-500 mb-8 text-base sm:text-lg">
          No spam, no duplicates — just jobs worth applying to.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/jobs"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-black border-2 border-black transition-all hover:brightness-95 active:translate-y-0.5 active:shadow-none"
            style={{
              backgroundColor: "#6fde8a",
              boxShadow: "0 3px 0 0 #000",
            }}
          >
            Browse All Jobs
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/api/auth/signin"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-medium text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Sign in for free
          </Link>
        </div>
      </section>

      {/* Scrolling jobs ticker */}
      <section className="overflow-hidden py-8 border-y border-gray-100">
        <div className="ticker-track">
          {[...recentJobs, ...recentJobs].map((job, i) => (
            <Link
              key={`${job.slug}-${i}`}
              href={`/jobs/${job.slug}`}
              className="flex-shrink-0 w-72 rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
              <p className="text-xs text-gray-500 mt-1">{job.company}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">{job.location}</span>
                {job.salary && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-green-600 font-medium">{job.salary}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-2xl px-6 py-14">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{jobs.length}+</p>
            <p className="text-sm text-gray-500 mt-1">Open positions</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">{totalCompanies}</p>
            <p className="text-sm text-gray-500 mt-1">Companies</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">24h</p>
            <p className="text-sm text-gray-500 mt-1">Update cycle</p>
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="mx-auto max-w-3xl px-6 pb-14">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5 text-center">
          Companies hiring now
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {topCompanies.map((name) => (
            <span
              key={name}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100"
            >
              {name}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 bg-gray-50">
            +{totalCompanies - topCompanies.length} more
          </span>
        </div>
      </section>

      {/* What you get */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">
            What you get
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Internships & new grad roles",
                desc: "We focus on entry-level SWE positions at real companies — not recruiter spam.",
              },
              {
                title: "Updated every day",
                desc: "New listings added daily so you see roles before they blow up on LinkedIn.",
              },
              {
                title: "Salary info when available",
                desc: "Know what a role pays before you waste time applying.",
              },
              {
                title: "Daily email alerts",
                desc: "Get 5 matched jobs in your inbox every morning. Set your keywords and forget it.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Stop doomscrolling LinkedIn
        </h2>
        <p className="text-gray-500 mb-6">
          We already found the jobs. You just need to apply.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-black border-2 border-black transition-all hover:brightness-95 active:translate-y-0.5 active:shadow-none"
          style={{
            backgroundColor: "#6fde8a",
            boxShadow: "0 3px 0 0 #000",
          }}
        >
          Browse All Jobs
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
