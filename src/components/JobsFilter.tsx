"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatSalary, slugifyCompany } from "@/lib/utils";

interface Job {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  snippet: string;
}

export default function JobsFilter({
  jobs,
  locations,
}: {
  jobs: Job[];
  locations: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q);

      const matchesLocation =
        !selectedLocation || job.location === selectedLocation;

      const matchesRemote =
        !remoteOnly || job.location?.toLowerCase().includes("remote");

      return matchesSearch && matchesLocation && matchesRemote;
    });
  }, [jobs, search, selectedLocation, remoteOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of filtered) {
      const existing = map.get(job.company) || [];
      existing.push(job);
      map.set(job.company, existing);
    }
    return map;
  }, [filtered]);

  const hasFilters = search || selectedLocation || remoteOnly;

  return (
    <>
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all bg-gray-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              remoteOnly
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Remote
            </span>
          </button>

          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() =>
                setSelectedLocation(selectedLocation === loc ? null : loc)
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedLocation === loc
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {loc}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedLocation(null);
                setRemoteOnly(false);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col gap-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-800 mb-1">
              No jobs found
            </p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">
              {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
              {hasFilters ? " matching" : ""} at {grouped.size}{" "}
              {grouped.size === 1 ? "company" : "companies"}
            </p>
            {Array.from(grouped.entries()).map(([company, companyJobs]) => {
              const companySlug = slugifyCompany(company);
              return (
                <section key={company}>
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/companies/${companySlug}`}
                      className="text-base font-semibold text-gray-800 hover:text-gray-600 transition-colors"
                    >
                      {company}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {companyJobs.length}{" "}
                      {companyJobs.length === 1 ? "role" : "roles"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {companyJobs.map((job) => (
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
                            <p className="text-sm text-gray-500">
                              {job.location}
                            </p>
                          </div>
                          {job.salary && (
                            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                              {formatSalary(job.salary)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
