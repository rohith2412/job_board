import type { Metadata } from "next";
import Link from "next/link";
import { getAllFeaturedJobs } from "@/lib/data";

export const metadata: Metadata = {
  title: "About Reblet | Curated Software Engineering Jobs",
  description: "Reblet is a curated job board for software engineers in the USA and Canada. No spam, no duplicates — just jobs worth applying to.",
};

export default async function AboutPage() {
  const jobs = await getAllFeaturedJobs();
  const companies = [...new Set(jobs.map((j: { company: string }) => j.company))];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-6">About Reblet</h1>

        <div className="flex flex-col gap-8 text-base text-gray-600 leading-relaxed">
          <p className="text-lg">
            Reblet is a curated job board built specifically for software engineers looking for opportunities in the United States and Canada.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Our Mission</h2>
            <p>
              Job searching shouldn&apos;t feel like scrolling through an endless feed of irrelevant listings. We built Reblet to cut through the noise — every job on our platform is handpicked and verified, so you spend less time searching and more time applying to roles that actually matter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">What Makes Us Different</h2>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-800">Curated listings</strong>
                  <p className="text-sm text-gray-500 mt-1">Every job is reviewed before it goes live. No spam, no duplicates, no ghost listings.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-800">Software engineering focus</strong>
                  <p className="text-sm text-gray-500 mt-1">We only list software engineering roles — from internships to senior positions. No unrelated jobs cluttering your search.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-800">Apply directly</strong>
                  <p className="text-sm text-gray-500 mt-1">Apply to company-posted jobs right on Reblet with your resume. No redirects, no account walls.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-800">Updated daily</strong>
                  <p className="text-sm text-gray-500 mt-1">New jobs are added every day so you never miss an opportunity.</p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">By the Numbers</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <p className="text-2xl font-bold text-gray-900">{jobs.length}+</p>
                <p className="text-sm text-gray-500 mt-1">Active jobs</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 text-center">
                <p className="text-2xl font-bold text-gray-900">{companies.length}+</p>
                <p className="text-sm text-gray-500 mt-1">Companies hiring</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">For Employers</h2>
            <p className="mb-4">
              Looking to hire software engineers? Post your jobs on Reblet and reach a focused audience of qualified candidates. Company-posted jobs get premium placement with your logo, description, and a direct apply button.
            </p>
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-black border-2 border-black bg-green-300 shadow-[0_3px_0_0_#000] hover:shadow-[0_1px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition-all"
            >
              Post a Job
            </Link>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
            <p>
              Have a question, suggestion, or partnership inquiry? Reach out to us at{" "}
              <a href="mailto:rayandteamsupport@gmail.com" className="text-gray-800 underline hover:text-gray-600">
                rayandteamsupport@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
