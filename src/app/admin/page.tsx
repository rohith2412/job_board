"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "rohithra75@gmail.com";

interface User {
  email: string;
  name: string;
  image: string;
  region?: string;
  createdAt: string;
}

const REGION_LABELS: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  CH: "Switzerland",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  IN: "India",
  OTHER: "Other",
};

interface Analytics {
  totalVisits: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  uniqueVisitors: number;
  topPages: { _id: string; count: number }[];
  topLocations: { _id: { country: string; city: string }; count: number }[];
  dailyVisits: { _id: string; count: number }[];
}

interface PostedJob {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  experienceType: string;
}

interface JobItem {
  slug: string;
  title: string;
  company: string;
  location: string;
  experienceType: string;
  featured: boolean;
  createdAt: string;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 flex-1 min-w-[120px]">
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IN: "India",
  AU: "Australia",
  JP: "Japan",
  BR: "Brazil",
  NL: "Netherlands",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<"analytics" | "users" | "post" | "jobs">("analytics");
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const [rawText, setRawText] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success?: boolean; job?: PostedJob; error?: string } | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/admin/users").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("/api/admin/analytics").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("/api/admin/jobs").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
    ])
      .then(([userData, analyticsData, jobsData]) => {
        setUsers(userData.users || []);
        setAnalytics(analyticsData);
        setJobs(jobsData.jobs || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, [status, isAdmin]);

  async function handleDeleteJob(slug: string) {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch("/api/admin/delete-job", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.slug !== slug));
      }
    } catch {}
    setDeletingSlug(null);
  }

  async function handlePostJob() {
    if (!rawText.trim() || !applyLink.trim()) return;
    setPosting(true);
    setPostResult(null);

    try {
      const res = await fetch("/api/admin/post-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, applyLink }),
      });
      const data = await res.json();
      if (res.ok) {
        setPostResult({ success: true, job: data.job });
        setRawText("");
        setApplyLink("");
      } else {
        setPostResult({ error: data.error || "Failed to post job" });
      }
    } catch {
      setPostResult({ error: "Network error" });
    }
    setPosting(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </p>
          <p className="text-sm text-gray-500">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("analytics")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "analytics"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab("jobs")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "jobs"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setTab("post")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "post"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Post Job
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors cursor-pointer ${
              tab === "users"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {tab === "post" && (
          <div className="px-6 py-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Paste the full job posting from LinkedIn, Greenhouse, etc.
              </p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the entire job description here..."
                rows={12}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Link
              </label>
              <input
                type="url"
                value={applyLink}
                onChange={(e) => setApplyLink(e.target.value)}
                placeholder="https://careers.company.com/job/..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>

            <button
              onClick={handlePostJob}
              disabled={posting || !rawText.trim() || !applyLink.trim()}
              className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black ${
                posting || !rawText.trim() || !applyLink.trim()
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                  : "bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
              }`}
            >
              {posting ? "Processing with AI..." : "Post Job"}
            </button>

            {postResult?.success && postResult.job && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Job posted successfully!
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Title:</span> {postResult.job.title}</p>
                  <p><span className="font-medium">Company:</span> {postResult.job.company}</p>
                  <p><span className="font-medium">Location:</span> {postResult.job.location}</p>
                  {postResult.job.salary && (
                    <p><span className="font-medium">Salary:</span> {postResult.job.salary}</p>
                  )}
                  <p><span className="font-medium">Type:</span> {postResult.job.experienceType}</p>
                </div>
                <a
                  href={`/jobs/${postResult.job.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm font-medium text-green-800 underline underline-offset-4"
                >
                  View job page
                </a>
              </div>
            )}

            {postResult?.error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{postResult.error}</p>
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && analytics && (
          <div className="px-6 py-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
              <StatCard label="Today" value={analytics.todayVisits} />
              <StatCard label="This Week" value={analytics.weekVisits} />
              <StatCard label="This Month" value={analytics.monthVisits} />
              <StatCard label="All Time" value={analytics.totalVisits} sub={`${analytics.uniqueVisitors} unique`} />
            </div>

            {analytics.dailyVisits.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Daily Visits (Last 30 Days)
                </h2>
                <div className="flex items-end gap-[3px] h-28 p-4 rounded-xl bg-gray-50">
                  {analytics.dailyVisits.map((day) => {
                    const max = Math.max(
                      ...analytics.dailyVisits.map((d) => d.count)
                    );
                    const height = max > 0 ? (day.count / max) * 100 : 0;
                    return (
                      <div
                        key={day._id}
                        className="flex-1 bg-gray-900 rounded-sm min-h-[2px] group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day._id}: ${day.count} visits`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {day._id.slice(5)}: {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Top Pages
              </h2>
              <div className="flex flex-col gap-1.5">
                {analytics.topPages.map((page) => (
                  <div
                    key={page._id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700 font-mono truncate mr-4">
                      {page._id}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {page.count}
                    </span>
                  </div>
                ))}
                {analytics.topPages.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No page views yet
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Visitor Locations
              </h2>
              <div className="flex flex-col gap-1.5">
                {analytics.topLocations.map((loc, i) => {
                  const country =
                    COUNTRY_NAMES[loc._id.country] || loc._id.country;
                  const label = loc._id.city
                    ? `${loc._id.city}, ${country}`
                    : country || "Unknown";
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50"
                    >
                      <span className="text-sm text-gray-700 truncate mr-4">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {loc.count}
                      </span>
                    </div>
                  );
                })}
                {analytics.topLocations.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    No location data yet (available on Vercel)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "jobs" && (
          <div className="px-6 py-6">
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No jobs yet
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {jobs.map((job) => (
                  <div
                    key={job.slug}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.company} · {job.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(job.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                          {job.experienceType}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteJob(job.slug)}
                      disabled={deletingSlug === job.slug}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingSlug === job.slug ? "..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="px-6 py-6">
            {users.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No users yet
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {users.map((user, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {user.region && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {REGION_LABELS[user.region] || user.region}
                        </span>
                      )}
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
