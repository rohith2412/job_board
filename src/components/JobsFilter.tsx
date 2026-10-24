"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatSalary } from "@/lib/utils";

interface Job {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  snippet: string;
  link: string;
  experienceType: string;
  createdAt: string;
  source: string;
  description: string;
  applyUrl: string;
  logo: string;
}

const DATE_OPTIONS = [
  { label: "Last 24 hours", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
];

function Dropdown({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
          value
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {icon}
        <span className="truncate max-w-[120px]">{value || label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-100/50 z-50 py-1.5 max-h-64 overflow-y-auto">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              !value
                ? "text-gray-900 font-medium bg-gray-50"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            All {label}s
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                value === opt
                  ? "text-gray-900 font-medium bg-gray-50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateDropdown({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = DATE_OPTIONS.find((o) => o.days === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
          value
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="truncate max-w-[120px]">{selectedLabel || "Date Posted"}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-100/50 z-50 py-1.5">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              !value
                ? "text-gray-900 font-medium bg-gray-50"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            Any time
          </button>
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => {
                onChange(opt.days);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                value === opt.days
                  ? "text-gray-900 font-medium bg-gray-50"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string, currentTime: number): string {
  const now = new Date(currentTime);
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

function ApplyButton({ link }: { link: string }) {
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all flex-shrink-0"
    >
      Apply
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function JobsFilterInner({
  jobs,
  locations,
}: {
  jobs: Job[];
  locations: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<number | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);

  const companies = useMemo(
    () => [...new Set(jobs.map((j) => j.company))].sort(),
    [jobs]
  );

  const experienceTypes = useMemo(
    () => [...new Set(jobs.map((j) => j.experienceType).filter(Boolean))].sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const currentTime = now ?? 0;
    return jobs.filter((job) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q);

      const matchesLocation =
        !selectedLocation || job.location === selectedLocation;

      const matchesCompany = !selectedCompany || job.company === selectedCompany;

      const matchesType = !selectedType || job.experienceType === selectedType;

      const matchesRemote =
        !remoteOnly || job.location?.toLowerCase().includes("remote");

      const matchesDate =
        !dateFilter || !currentTime ||
        (currentTime - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= dateFilter;

      return matchesSearch && matchesLocation && matchesCompany && matchesType && matchesRemote && matchesDate;
    });
  }, [jobs, search, selectedLocation, selectedCompany, selectedType, remoteOnly, dateFilter, now]);

  const hasFilters = search || selectedLocation || selectedCompany || selectedType || remoteOnly || dateFilter;
  const activeCount = [selectedLocation, selectedCompany, selectedType, remoteOnly, search, dateFilter].filter(Boolean).length;

  return (
    <>
      <div className="border-b border-gray-100">
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              width="20"
              height="20"
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
              placeholder="Job title, keyword, or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DateDropdown value={dateFilter} onChange={setDateFilter} />

            <Dropdown
              label="Location"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              value={selectedLocation}
              options={locations}
              onChange={setSelectedLocation}
            />

            <Dropdown
              label="Company"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                </svg>
              }
              value={selectedCompany}
              options={companies}
              onChange={setSelectedCompany}
            />

            <Dropdown
              label="Experience"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
              }
              value={selectedType}
              options={experienceTypes}
              onChange={setSelectedType}
            />

            <button
              onClick={() => setRemoteOnly(!remoteOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border whitespace-nowrap ${
                remoteOnly
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Remote
            </button>

            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedLocation(null);
                  setSelectedCompany(null);
                  setSelectedType(null);
                  setDateFilter(null);
                  setRemoteOnly(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
                Reset{activeCount > 1 ? ` (${activeCount})` : ""}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "job" : "jobs"}
            {hasFilters ? ` found out of ${jobs.length}` : " available"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              No matching jobs
            </p>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">
              Try removing some filters or searching for something else
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedLocation(null);
                setSelectedCompany(null);
                setSelectedType(null);
                setDateFilter(null);
                setRemoteOnly(false);
              }}
              className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((job) =>
              job.source === "company" ? (
                <div
                  key={job.slug}
                  onClick={() => router.push(`/jobs/${job.slug}`)}
                  role="link"
                  className="group block rounded-xl border border-green-200 bg-green-50/40 hover:border-green-300 hover:shadow-md hover:shadow-green-100/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {job.logo ? (
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                          {job.company.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-600">{job.company}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {job.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {job.location}
                            </span>
                          )}
                          {job.salary && (
                            <span className="text-xs font-semibold text-gray-700">{formatSalary(job.salary)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-green-700 bg-green-200/60 px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider">
                        Hiring
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {job.title}
                    </h3>

                    {job.description && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 break-words overflow-hidden">
                        {job.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-gray-400">
                        {now ? timeAgo(job.createdAt, now) : ""}
                      </p>
                      {job.applyUrl ? (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all flex-shrink-0"
                        >
                          Apply
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                          </svg>
                        </a>
                      ) : (
                        <span
                          onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${job.slug}/apply`); }}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all flex-shrink-0 cursor-pointer"
                        >
                          Apply on Reblet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={job.slug}
                  onClick={() => router.push(`/jobs/${job.slug}`)}
                  role="link"
                  className="group block p-4 sm:p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {job.location}
                        </span>
                        {job.location?.toLowerCase().includes("remote") && (
                          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Remote
                          </span>
                        )}
                        {job.salary && (
                          <span className="text-sm font-semibold text-gray-900">
                            {formatSalary(job.salary)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {now ? timeAgo(job.createdAt, now) : ""}
                      </p>
                    </div>
                    <ApplyButton link={job.link} />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function JobsFilter({
  jobs,
  locations,
}: {
  jobs: Job[];
  locations: string[];
}) {
  return <JobsFilterInner jobs={jobs} locations={locations} />;
}
