"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
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
  postedByName?: string;
  postedByImage?: string;
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
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
          value
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {icon}
        <span className="truncate flex-1 text-left">{value || label}</span>
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
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
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
        <span className="truncate flex-1 text-left">{selectedLabel || "Date Posted"}</span>
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
  const { data: session } = useSession();

  if (!session) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); signIn("google", { callbackUrl: window.location.href }); }}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold border border-gray-300 hover:bg-gray-50 transition-all flex-shrink-0 cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Sign in to apply
      </button>
    );
  }

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
  companies,
  experienceTypes,
  currentPage,
  totalPages,
  totalJobs,
  hasFilters,
}: {
  jobs: Job[];
  locations: string[];
  companies: string[];
  experienceTypes: string[];
  currentPage: number;
  totalPages: number;
  totalJobs: number;
  hasFilters: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const selectedLocation = searchParams.get("location");
  const selectedCompany = searchParams.get("company");
  const selectedType = searchParams.get("type");
  const remoteOnly = searchParams.get("remote") === "true";
  const dateFilter = searchParams.get("date") ? parseInt(searchParams.get("date")!, 10) : null;
  const searchParam = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(searchParam);

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }, [searchParams, router]);

  useEffect(() => {
    if (searchInput === searchParam) return;
    const timer = setTimeout(() => {
      updateFilters({ q: searchInput || null });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    function updateView() {
      setViewMode(window.innerWidth >= 640 ? "grid" : "list");
    }
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); }, []);

  const activeCount = [selectedLocation, selectedCompany, selectedType, remoteOnly, dateFilter].filter(Boolean).length;

  return (
    <>
      <div className="border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all bg-white"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); updateFilters({ q: null }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div ref={filtersRef} className="relative">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer border whitespace-nowrap ${
                  activeCount > 0
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-gray-900 text-xs font-bold">
                    {activeCount}
                  </span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-100/50 z-50 p-4 flex flex-col gap-3">
                  <DateDropdown value={dateFilter} onChange={(v) => updateFilters({ date: v ? String(v) : null })} />

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
                    onChange={(v) => updateFilters({ location: v })}
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
                    onChange={(v) => updateFilters({ company: v })}
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
                    onChange={(v) => updateFilters({ type: v })}
                  />

                  <button
                    onClick={() => updateFilters({ remote: remoteOnly ? null : "true" })}
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
                        setSearchInput("");
                        router.push("/jobs");
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all cursor-pointer border border-red-200"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                      Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{totalJobs}</span>{" "}
            {hasFilters ? (totalJobs === 1 ? "match" : "matches") : (totalJobs === 1 ? "job" : "jobs available")}
            {totalPages > 1 && ` · page ${currentPage} of ${totalPages}`}
          </p>
        </div>

        {jobs.length === 0 && hasFilters ? (
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
                setSearchInput("");
                router.push("/jobs");
              }}
              className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
          {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {jobs.map((job) => (
              <div
                key={job.slug}
                className="relative rounded-xl border border-gray-100 overflow-hidden"
              >
                <div
                  onClick={() => session ? router.push(`/jobs/${job.slug}`) : undefined}
                  role="link"
                  className={`group block p-4 sm:p-5 h-full transition-all ${session ? "cursor-pointer hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50" : "blur-[2px] opacity-60 select-none pointer-events-none"}`}
                >
                  <div className="flex flex-col gap-3 h-full">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-500 font-medium truncate">{job.company}</span>
                      {job.source === "company" && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-200/60 px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider">
                          Hiring
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 leading-snug">
                      {job.title}
                    </h3>
                    <div className="flex flex-col gap-1.5 mt-auto">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate">{job.location}</span>
                      </span>
                      {job.salary && (
                        <span className="text-sm font-semibold text-gray-900">{formatSalary(job.salary)}</span>
                      )}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          {now ? timeAgo(job.createdAt, now) : ""}
                        </p>
                        {session ? (
                          <ApplyButton link={job.link} />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_3px_0_0_#000] flex-shrink-0">
                            Apply
                          </span>
                        )}
                      </div>
                      {job.postedByName && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          {job.postedByImage ? (
                            <img src={job.postedByImage} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-500">
                              {job.postedByName[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] text-gray-400 truncate">Shared by {job.postedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {!session && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-xl">
                    <button
                      onClick={() => signIn("google", { callbackUrl: window.location.href })}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img src="/google-signin-button.svg" alt="Sign in with Google" className="h-10" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          ) : (
          <div className="flex flex-col gap-2.5">
            {jobs.map((job) =>
              job.source === "company" ? (
                <div
                  key={job.slug}
                  className="relative rounded-xl border border-green-200 bg-green-50/40 overflow-hidden"
                >
                  <div
                    onClick={() => session ? router.push(`/jobs/${job.slug}`) : undefined}
                    role="link"
                    className={`group block transition-all ${session ? "cursor-pointer hover:border-green-300 hover:shadow-md hover:shadow-green-100/50" : "blur-[2px] opacity-60 select-none pointer-events-none"}`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        {job.logo ? (
                          <img
                            src={job.logo}
                            alt={job.company}
                            className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-gray-200 flex-shrink-0"
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
                        {session ? (
                          job.applyUrl ? (
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
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_4px_0_0_#000] flex-shrink-0">
                            Apply
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                            </svg>
                          </span>
                        )}
                      </div>
                      {job.postedByName && (
                        <div className="flex items-center gap-1.5 pt-1.5">
                          {job.postedByImage ? (
                            <img src={job.postedByImage} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-500">
                              {job.postedByName[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] text-gray-400 truncate">Shared by {job.postedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!session && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-xl">
                      <button
                        onClick={() => signIn("google", { callbackUrl: window.location.href })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img src="/google-signin-button.svg" alt="Sign in with Google" className="h-10" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={job.slug}
                  className="relative rounded-xl border border-gray-100 overflow-hidden"
                >
                  <div
                    onClick={() => session ? router.push(`/jobs/${job.slug}`) : undefined}
                    role="link"
                    className={`group block p-4 sm:p-5 transition-all ${session ? "cursor-pointer hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/50" : "blur-[2px] opacity-60 select-none pointer-events-none"}`}
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
                      {session ? (
                        <ApplyButton link={job.link} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-green-300 text-black text-xs font-semibold border-2 border-black shadow-[0_4px_0_0_#000] flex-shrink-0">
                          Apply
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {job.postedByName && (
                      <div className="flex items-center gap-1.5 px-4 sm:px-5 pb-3 -mt-1">
                        {job.postedByImage ? (
                          <img src={job.postedByImage} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-semibold text-gray-500">
                            {job.postedByName[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] text-gray-400 truncate">Shared by {job.postedByName}</span>
                      </div>
                    )}
                  </div>
                  {!session && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-xl">
                      <button
                        onClick={() => signIn("google", { callbackUrl: window.location.href })}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img src="/google-signin-button.svg" alt="Sign in with Google" className="h-10" />
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              {currentPage > 1 ? (
                <Link
                  href={(() => { const p = new URLSearchParams(searchParams.toString()); if (currentPage === 2) p.delete("page"); else p.set("page", String(currentPage - 1)); const qs = p.toString(); return qs ? `/jobs?${qs}` : "/jobs"; })()}
                  scroll={true}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 bg-white opacity-40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </span>
              )}
              <span className="text-sm text-gray-500 px-3">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> of {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={(() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(currentPage + 1)); return `/jobs?${p.toString()}`; })()}
                  scroll={true}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 bg-white opacity-40">
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              )}
            </div>
          )}
          </>
        )}
      </div>
    </>
  );
}

export default function JobsFilter({
  jobs,
  locations,
  companies,
  experienceTypes,
  currentPage,
  totalPages,
  totalJobs,
  hasFilters,
}: {
  jobs: Job[];
  locations: string[];
  companies: string[];
  experienceTypes: string[];
  currentPage: number;
  totalPages: number;
  totalJobs: number;
  hasFilters: boolean;
}) {
  return (
    <JobsFilterInner
      jobs={jobs}
      locations={locations}
      companies={companies}
      experienceTypes={experienceTypes}
      currentPage={currentPage}
      totalPages={totalPages}
      totalJobs={totalJobs}
      hasFilters={hasFilters}
    />
  );
}
