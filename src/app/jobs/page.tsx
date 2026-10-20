"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Job {
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary: string;
  source: string;
}

function formatSalary(salary: string): string {
  return salary.replace(/[\d,]+/g, (match) =>
    Number(match.replace(/,/g, "")).toLocaleString()
  );
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchJobs(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, location }),
    });
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Jobs</h1>

        <form onSubmit={searchJobs} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Keywords (e.g. developer)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div
              key={i}
              onClick={async () => {
                const res = await fetch("/api/jobs/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(job),
                });
                const data = await res.json();
                router.push(`/jobs/${data.slug}`);
              }}
              className="cursor-pointer rounded-md border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-blue-600">
                  {job.title}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  {job.source}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {job.company} {job.location && `· ${job.location}`}
              </p>
              {job.salary && (
                <p className="text-sm text-gray-500 mt-1">{formatSalary(job.salary)}</p>
              )}
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {job.snippet.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
