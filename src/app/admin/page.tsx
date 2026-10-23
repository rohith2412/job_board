"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "rohithra75@gmail.com";

interface User {
  email: string;
  name: string;
  image: string;
  password?: boolean;
  region?: string;
  createdAt: string;
}

interface RatingItem {
  _id: string;
  userEmail: string;
  score: number;
  grade: string;
  summary: string;
  ratedAt: string;
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

interface LinkedInPostItem {
  _id: string;
  content: string;
  profile: "company" | "personal1" | "personal2";
  status: "draft" | "scheduled" | "posted";
  jobSlugs: string[];
  scheduledFor?: string;
  postedAt?: string;
  createdAt: string;
}

const PROFILE_LABELS: Record<string, string> = {
  company: "Reblet (Company)",
  personal1: "Profile 1",
  personal2: "Profile 2",
};

type Tab = "analytics" | "users" | "jobs" | "ratings" | "content" | "post";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "analytics", label: "Analytics", icon: "chart" },
  { key: "users", label: "Users", icon: "users" },
  { key: "jobs", label: "Jobs", icon: "briefcase" },
  { key: "ratings", label: "Ratings", icon: "star" },
  { key: "content", label: "Content", icon: "send" },
  { key: "post", label: "Post Job", icon: "plus" },
];

function TabIcon({ icon }: { icon: string }) {
  const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "chart":
      return <svg {...props}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
    case "users":
      return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
    case "briefcase":
      return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>;
    case "star":
      return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case "send":
      return <svg {...props}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    case "plus":
      return <svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
    default:
      return null;
  }
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex-1 min-w-[140px]">
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<Tab>("analytics");
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deletingRating, setDeletingRating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [rawText, setRawText] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success?: boolean; job?: PostedJob; error?: string } | null>(null);
  const [revalidating, setRevalidating] = useState(false);

  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPostItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState<LinkedInPostItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editProfile, setEditProfile] = useState<"company" | "personal1" | "personal2">("company");
  const [copied, setCopied] = useState<string | null>(null);
  const [linkedInAccounts, setLinkedInAccounts] = useState<{ profileKey: string; name: string; connected: boolean }[]>([]);
  const [publishing, setPublishing] = useState<string | null>(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/admin/users").then((r) => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/analytics").then((r) => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/jobs").then((r) => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/ratings").then((r) => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/linkedin-posts").then((r) => r.ok ? r.json() : { posts: [] }),
      fetch("/api/admin/linkedin-accounts").then((r) => r.ok ? r.json() : { accounts: [] }),
    ])
      .then(([userData, analyticsData, jobsData, ratingsData, postsData, accountsData]) => {
        setUsers(userData.users || []);
        setAnalytics(analyticsData);
        setJobs(jobsData.jobs || []);
        setRatings(ratingsData.ratings || []);
        setLinkedInPosts(postsData.posts || []);
        setLinkedInAccounts(accountsData.accounts || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, [status, isAdmin]);

  async function handleDeleteJob(slug: string) {
    if (!confirm(`Delete job "${slug}"? This cannot be undone.`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch("/api/admin/delete-job", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) setJobs((prev) => prev.filter((j) => j.slug !== slug));
    } catch {}
    setDeletingSlug(null);
  }

  async function handleDeleteUser(email: string) {
    if (!confirm(`Delete user "${email}" and all their data? This cannot be undone.`)) return;
    setDeletingUser(email);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.email !== email));
        setRatings((prev) => prev.filter((r) => r.userEmail !== email));
      }
    } catch {}
    setDeletingUser(null);
  }

  async function handleDeleteRating(id: string) {
    if (!confirm("Delete this rating? This cannot be undone.")) return;
    setDeletingRating(id);
    try {
      const res = await fetch("/api/admin/delete-rating", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setRatings((prev) => prev.filter((r) => r._id !== id));
    } catch {}
    setDeletingRating(null);
  }

  async function handleRevalidate() {
    setRevalidating(true);
    try {
      await fetch("/api/admin/revalidate", { method: "POST" });
    } catch {}
    setRevalidating(false);
  }

  async function handleGeneratePost() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5, audience: "US" }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setEditContent(data.content);
        setEditProfile("company");
        setEditingPost({ _id: "", content: data.content, profile: "company", status: "draft", jobSlugs: data.jobSlugs || [], createdAt: new Date().toISOString() });
      }
    } catch {}
    setGenerating(false);
  }

  async function handleSavePost() {
    if (!editContent.trim()) return;
    try {
      if (editingPost?._id) {
        const res = await fetch("/api/admin/linkedin-posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPost._id, content: editContent, profile: editProfile }),
        });
        const data = await res.json();
        if (res.ok) {
          setLinkedInPosts((prev) => prev.map((p) => p._id === editingPost._id ? data.post : p));
        }
      } else {
        const res = await fetch("/api/admin/linkedin-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent, profile: editProfile, status: "scheduled", jobSlugs: editingPost?.jobSlugs || [] }),
        });
        const data = await res.json();
        if (res.ok) {
          setLinkedInPosts((prev) => [data.post, ...prev]);
        }
      }
      setEditingPost(null);
      setEditContent("");
    } catch {}
  }

  async function handleMarkPosted(id: string) {
    try {
      const res = await fetch("/api/admin/linkedin-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "posted" }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkedInPosts((prev) => prev.map((p) => p._id === id ? data.post : p));
      }
    } catch {}
  }

  async function handleDeletePost(id: string) {
    try {
      const res = await fetch("/api/admin/linkedin-posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLinkedInPosts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch {}
  }

  async function handlePublishPost(postId: string) {
    if (!confirm("Publish this post to LinkedIn now?")) return;
    setPublishing(postId);
    try {
      const res = await fetch("/api/admin/linkedin-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkedInPosts((prev) => prev.map((p) => p._id === postId ? data.post : p));
      } else {
        alert(data.error || "Failed to publish");
      }
    } catch {
      alert("Network error");
    }
    setPublishing(null);
  }

  function handleCopyPost(post: LinkedInPostItem) {
    navigator.clipboard.writeText(post.content);
    setCopied(post._id);
    setTimeout(() => setCopied(null), 2000);
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
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-800 mb-2">Access Denied</p>
          <p className="text-sm text-gray-500">You don&apos;t have permission to view this page.</p>
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

  const filteredUsers = searchQuery
    ? users.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : users;
  const filteredJobs = searchQuery
    ? jobs.filter((j) => j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || j.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    : jobs;
  const filteredRatings = searchQuery
    ? ratings.filter((r) => r.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()))
    : ratings;

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-400 mt-0.5">reblet.com</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRevalidate}
                disabled={revalidating}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Clear page cache so new data shows on the site"
              >
                {revalidating ? "Clearing..." : "Clear Cache"}
              </button>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">{users.length} users</p>
                <p className="text-xs text-gray-400">{jobs.length} jobs</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="bg-white border-b border-gray-100 px-6">
          <div className="flex gap-1 overflow-x-auto py-2 -mx-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  tab === t.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <TabIcon icon={t.icon} />
                {t.label}
                {t.key === "users" && <span className="ml-0.5 text-[10px] opacity-70">{users.length}</span>}
                {t.key === "jobs" && <span className="ml-0.5 text-[10px] opacity-70">{jobs.length}</span>}
                {t.key === "ratings" && <span className="ml-0.5 text-[10px] opacity-70">{ratings.length}</span>}
                {t.key === "content" && linkedInPosts.filter((p) => p.status !== "posted").length > 0 && <span className="ml-0.5 text-[10px] opacity-70">{linkedInPosts.filter((p) => p.status !== "posted").length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar (for users, jobs, ratings) */}
        {(tab === "users" || tab === "jobs" || tab === "ratings") && (
          <div className="px-6 pt-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${tab}...`}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && analytics && (
          <div className="px-6 py-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
              <StatCard label="Today" value={analytics.todayVisits} />
              <StatCard label="This Week" value={analytics.weekVisits} />
              <StatCard label="This Month" value={analytics.monthVisits} />
              <StatCard label="All Time" value={analytics.totalVisits} sub={`${analytics.uniqueVisitors} unique`} />
            </div>

            {analytics.dailyVisits.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Daily Visits (Last 30 Days)
                </h2>
                <div className="flex items-end gap-[3px] h-28">
                  {analytics.dailyVisits.map((day) => {
                    const max = Math.max(...analytics.dailyVisits.map((d) => d.count));
                    const height = max > 0 ? (day.count / max) * 100 : 0;
                    return (
                      <div
                        key={day._id}
                        className="flex-1 bg-gray-900 rounded-sm min-h-[2px] group relative hover:bg-green-500 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day._id}: ${day.count} visits`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {day._id.slice(5)}: {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Top Pages
                </h2>
                <div className="flex flex-col gap-1.5">
                  {analytics.topPages.map((page) => (
                    <div key={page._id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-700 font-mono truncate mr-4">{page._id}</span>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{page.count}</span>
                    </div>
                  ))}
                  {analytics.topPages.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">No page views yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Visitor Locations
                </h2>
                <div className="flex flex-col gap-1.5">
                  {analytics.topLocations.map((loc, i) => {
                    const country = COUNTRY_NAMES[loc._id.country] || loc._id.country;
                    const label = loc._id.city ? `${loc._id.city}, ${country}` : country || "Unknown";
                    return (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-700 truncate mr-4">{label}</span>
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{loc.count}</span>
                      </div>
                    );
                  })}
                  {analytics.topLocations.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">No location data yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}</p>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                {searchQuery ? "No users match your search" : "No users yet"}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredUsers.map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold">
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        {user.email === ADMIN_EMAIL && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {user.region && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {REGION_LABELS[user.region] || user.region}
                          </span>
                        )}
                      </div>
                    </div>
                    {user.email !== ADMIN_EMAIL && (
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        disabled={deletingUser === user.email}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete user"
                      >
                        {deletingUser === user.email ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {tab === "jobs" && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}</p>
            </div>
            {filteredJobs.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                {searchQuery ? "No jobs match your search" : "No jobs yet"}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredJobs.map((job) => (
                  <div key={job.slug} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">{job.company} · {job.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {job.experienceType}
                        </span>
                        {job.featured && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">FEATURED</span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/jobs/${job.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="View job"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                    <button
                      onClick={() => handleDeleteJob(job.slug)}
                      disabled={deletingSlug === job.slug}
                      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete job"
                    >
                      {deletingSlug === job.slug ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {tab === "ratings" && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{filteredRatings.length} {filteredRatings.length === 1 ? "rating" : "ratings"}</p>
            </div>
            {filteredRatings.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                {searchQuery ? "No ratings match your search" : "No ratings yet"}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredRatings.map((rating) => {
                  const scoreColor = rating.score >= 80 ? "text-green-600 bg-green-50" : rating.score >= 60 ? "text-amber-600 bg-amber-50" : rating.score >= 40 ? "text-orange-600 bg-orange-50" : "text-red-600 bg-red-50";
                  return (
                    <div key={rating._id} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${scoreColor}`}>
                        <span className="text-base font-bold leading-none">{rating.score}</span>
                        <span className="text-[9px] font-semibold mt-0.5">{rating.grade}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{rating.userEmail}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{rating.summary}</p>
                        <span className="text-[10px] text-gray-400 mt-1 inline-block">
                          {new Date(rating.ratedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteRating(rating._id)}
                        disabled={deletingRating === rating._id}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete rating"
                      >
                        {deletingRating === rating._id ? (
                          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {tab === "content" && (
          <div className="px-6 py-4 flex flex-col gap-5">
            {/* Connected Accounts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">LinkedIn Accounts</h3>
              <div className="flex flex-col gap-2">
                {(["company", "personal1", "personal2"] as const).map((key) => {
                  const account = linkedInAccounts.find((a) => a.profileKey === key);
                  return (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${account?.connected ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="text-sm font-medium text-gray-700">{PROFILE_LABELS[key]}</span>
                        {account?.connected && (
                          <span className="text-xs text-gray-400">{account.name}</span>
                        )}
                      </div>
                      <a
                        href={`/api/admin/linkedin-auth?profile=${key}`}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          account?.connected
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        }`}
                      >
                        {account?.connected ? "Reconnect" : "Connect"}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGeneratePost}
                disabled={generating}
                className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black ${
                  generating
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                    : "bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                }`}
              >
                {generating ? "Generating..." : "Generate Post from Latest Jobs"}
              </button>
            </div>

            {/* Editor */}
            {editingPost && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {editingPost._id ? "Edit Post" : "New Post"}
                  </h3>
                  <button onClick={() => { setEditingPost(null); setEditContent(""); }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                    Cancel
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Profile</label>
                  <div className="flex gap-2">
                    {(["company", "personal1", "personal2"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditProfile(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          editProfile === p
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {PROFILE_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-y font-mono leading-relaxed"
                  placeholder="Post content..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">{editContent.length} characters</p>
                  <button
                    onClick={handleSavePost}
                    disabled={!editContent.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingPost._id ? "Update" : "Save to Queue"}
                  </button>
                </div>
              </div>
            )}

            {/* Post queue */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Post Queue</h3>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {linkedInPosts.filter((p) => p.status === "scheduled").length} scheduled
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {linkedInPosts.filter((p) => p.status === "draft").length} drafts
                  </span>
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {linkedInPosts.filter((p) => p.status === "posted").length} posted
                  </span>
                </div>
              </div>

              {linkedInPosts.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No posts yet. Generate your first one!
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {linkedInPosts.map((post) => {
                    const statusColor = post.status === "posted" ? "text-green-600 bg-green-50" : post.status === "scheduled" ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-100";
                    return (
                      <div key={post._id} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
                              {post.status}
                            </span>
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {PROFILE_LABELS[post.profile]}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-4 whitespace-pre-wrap mb-3 leading-relaxed">{post.content}</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyPost(post)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            {copied === post._id ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                Copy
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => { setEditingPost(post); setEditContent(post.content); setEditProfile(post.profile); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          {post.status !== "posted" && linkedInAccounts.find((a) => a.profileKey === post.profile && a.connected) && (
                            <button
                              onClick={() => handlePublishPost(post._id)}
                              disabled={publishing === post._id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                              {publishing === post._id ? "Publishing..." : "Publish"}
                            </button>
                          )}
                          {post.status !== "posted" && (
                            <button
                              onClick={() => handleMarkPosted(post._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                            >
                              Mark Posted
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Job Tab */}
        {tab === "post" && (
          <div className="px-6 py-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
              <p className="text-xs text-gray-400 mb-2">Paste the full job posting from LinkedIn, Greenhouse, etc.</p>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the entire job description here..."
                rows={12}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apply Link</label>
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
                <p className="text-sm font-semibold text-green-800 mb-2">Job posted successfully!</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Title:</span> {postResult.job.title}</p>
                  <p><span className="font-medium">Company:</span> {postResult.job.company}</p>
                  <p><span className="font-medium">Location:</span> {postResult.job.location}</p>
                  {postResult.job.salary && <p><span className="font-medium">Salary:</span> {postResult.job.salary}</p>}
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
      </div>
    </main>
  );
}
