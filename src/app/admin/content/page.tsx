"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const MAX_CHARS = 3000;

// <input type="datetime-local"> works in local time without a zone.
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextHour() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

const SLOT_GAP_MS = 30 * 60 * 1000;

// Upcoming daily slot times in local time, skipping the past and any time already taken by a scheduled post.
function upcomingSlots(times: string[], count: number, taken: Date[]) {
  const sorted = [...times].filter(Boolean).sort();
  const earliest = Date.now() + 5 * 60 * 1000;
  const slots: Date[] = [];
  for (let day = 0; slots.length < count && day < 30; day++) {
    for (const t of sorted) {
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setDate(d.getDate() + day);
      d.setHours(h, m, 0, 0);
      if (d.getTime() < earliest) continue;
      if (taken.some((x) => Math.abs(x.getTime() - d.getTime()) < SLOT_GAP_MS)) continue;
      slots.push(d);
      if (slots.length === count) break;
    }
  }
  return slots;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface LinkedInPostItem {
  _id: string;
  content: string;
  profile: "personal1" | "personal2";
  status: "draft" | "scheduled" | "publishing" | "posted" | "failed";
  jobSlugs: string[];
  scheduledFor?: string;
  postedAt?: string;
  lastError?: string;
  publishedUrns?: string[];
  createdAt: string;
}

const PROFILE_LABELS: Record<string, string> = {
  personal1: "Profile 1",
  personal2: "Profile 2",
};

export default function ContentPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<LinkedInPostItem[]>([]);
  const [accounts, setAccounts] = useState<{ profileKey: string; name: string; connected: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [editingPost, setEditingPost] = useState<LinkedInPostItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editProfile, setEditProfile] = useState<"personal1" | "personal2">("personal1");
  const [scheduleAt, setScheduleAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showJobPicker, setShowJobPicker] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<{ slug: string; title: string; company: string; location: string }[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [slotTimes, setSlotTimes] = useState(["09:00", "13:00", "21:00"]);
  const [spotlightDays, setSpotlightDays] = useState(1);
  const [spotlights, setSpotlights] = useState<{ slug: string; title: string; content: string; when: string }[]>([]);
  const [spotlightBusy, setSpotlightBusy] = useState<"" | "drafting" | "scheduling">("");
  const [spotlightMsg, setSpotlightMsg] = useState("");

  const [aiInstruction, setAiInstruction] = useState("");
  const [refining, setRefining] = useState(false);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/admin/linkedin-posts").then((r) => r.ok ? r.json() : { posts: [] }),
      fetch("/api/admin/linkedin-accounts").then((r) => r.ok ? r.json() : { accounts: [] }),
    ])
      .then(([postsData, accountsData]) => {
        setPosts(postsData.posts || []);
        setAccounts(accountsData.accounts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, isAdmin]);

  async function openJobPicker() {
    setLoadingJobs(true);
    setShowJobPicker(true);
    setSelectedSlugs(new Set());
    try {
      const res = await fetch("/api/admin/generate-post");
      const data = await res.json();
      if (res.ok) setAvailableJobs(data.jobs || []);
    } catch {}
    setLoadingJobs(false);
  }

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleGenerate(slugs?: string[]) {
    setShowJobPicker(false);
    setGenerating(true);
    try {
      const body: Record<string, unknown> = { audience: "US" };
      if (slugs && slugs.length > 0) {
        body.slugs = slugs;
      } else {
        body.count = 5;
      }
      const res = await fetch("/api/admin/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setEditContent(data.content);
        setEditProfile("personal1");
        setScheduleAt(toLocalInput(nextHour()));
        setSaveError("");
        setEditingPost({
          _id: "",
          content: data.content,
          profile: "personal1",
          status: "draft",
          jobSlugs: data.jobSlugs || [],
          createdAt: new Date().toISOString(),
        });
      }
    } catch {}
    setGenerating(false);
  }

  async function draftSpotlightPosts() {
    const taken = posts
      .filter((p) => p.status === "scheduled" && p.scheduledFor)
      .map((p) => new Date(p.scheduledFor as string));
    const slots = upcomingSlots(slotTimes, slotTimes.filter(Boolean).length * spotlightDays, taken);
    if (slots.length === 0) {
      setSpotlightMsg("Add at least one posting time");
      return;
    }
    setSpotlightBusy("drafting");
    setSpotlightMsg("");
    try {
      const res = await fetch("/api/admin/linkedin-spotlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: slots.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSpotlightMsg(data.error || "Could not draft posts");
      } else {
        setSpotlights(
          (data.drafts as { slug: string; title: string; content: string }[]).map((d, i) => ({
            ...d,
            when: slots[i].toISOString(),
          }))
        );
        if (data.drafts.length < slots.length) {
          setSpotlightMsg(`Only ${data.drafts.length} jobs haven't been posted yet, so ${data.drafts.length} slots are filled.`);
        }
      }
    } catch {
      setSpotlightMsg("Network error");
    }
    setSpotlightBusy("");
  }

  async function scheduleSpotlights() {
    setSpotlightBusy("scheduling");
    setSpotlightMsg("");
    const remaining: typeof spotlights = [];
    const created: LinkedInPostItem[] = [];
    let firstError = "";
    for (const s of spotlights) {
      try {
        const res = await fetch("/api/admin/linkedin-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: s.content, profile: "personal1", status: "scheduled", scheduledFor: s.when, jobSlugs: [s.slug] }),
        });
        const data = await res.json();
        if (res.ok) created.push(data.post);
        else {
          remaining.push(s);
          firstError ||= data.error || "Could not schedule";
        }
      } catch {
        remaining.push(s);
        firstError ||= "Network error";
      }
    }
    setPosts((prev) => [...created, ...prev]);
    setSpotlights(remaining);
    setSpotlightMsg(firstError ? `${created.length} scheduled. ${remaining.length} failed: ${firstError}` : `${created.length} posts scheduled`);
    setSpotlightBusy("");
  }

  async function handleRefine() {
    if (!aiInstruction.trim() || !editContent.trim()) return;
    setRefining(true);
    try {
      const res = await fetch("/api/admin/refine-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, instruction: aiInstruction }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setEditContent(data.content);
        setAiInstruction("");
      }
    } catch {}
    setRefining(false);
  }

  function openEditor(post: LinkedInPostItem) {
    setEditingPost(post);
    setEditContent(post.content);
    setEditProfile(post.profile);
    setScheduleAt(toLocalInput(post.scheduledFor ? new Date(post.scheduledFor) : nextHour()));
    setSaveError("");
  }

  async function handleSave(nextStatus: "draft" | "scheduled") {
    if (!editContent.trim() || editContent.length > MAX_CHARS) return;
    if (nextStatus === "scheduled" && !scheduleAt) {
      setSaveError("Pick a date and time to schedule");
      return;
    }
    setSaving(true);
    setSaveError("");
    const scheduledFor = nextStatus === "scheduled" ? new Date(scheduleAt).toISOString() : null;
    try {
      const isNew = !editingPost?._id;
      const res = await fetch("/api/admin/linkedin-posts", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isNew ? { jobSlugs: editingPost?.jobSlugs || [] } : { id: editingPost?._id }),
          content: editContent,
          profile: editProfile,
          status: nextStatus,
          scheduledFor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not save the post");
      } else {
        setPosts((prev) => (isNew ? [data.post, ...prev] : prev.map((p) => (p._id === data.post._id ? data.post : p))));
        setEditingPost(null);
        setEditContent("");
      }
    } catch {
      setSaveError("Network error");
    }
    setSaving(false);
  }

  async function handleUnschedule(id: string) {
    try {
      const res = await fetch("/api/admin/linkedin-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "draft", scheduledFor: null }),
      });
      const data = await res.json();
      if (res.ok) setPosts((prev) => prev.map((p) => (p._id === id ? data.post : p)));
    } catch {}
  }

  async function handlePublish(postId: string) {
    const connectedNames = accounts.filter((a) => a.connected).map((a) => a.name).join(", ");
    if (!confirm(`Publish this post to LinkedIn now (${connectedNames})?`)) return;
    setPublishing(postId);
    try {
      const res = await fetch("/api/admin/linkedin-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const succeeded = data.results.filter((r: { success: boolean }) => r.success).length;
        const failed = data.results.filter((r: { success: boolean }) => !r.success);
        if (failed.length > 0) {
          alert(`Published to ${succeeded} account(s). Failed: ${failed.map((f: { name: string; error?: string }) => `${f.name}: ${f.error}`).join(", ")}`);
        }
        setPosts((prev) => prev.map((p) => p._id === postId ? data.post : p));
        if (succeeded === 0) alert(`Publishing failed: ${data.post?.lastError || "unknown error"}`);
      } else {
        alert(data.error || "Failed to publish");
      }
    } catch {
      alert("Network error");
    }
    setPublishing(null);
  }

  async function handleMarkPosted(id: string) {
    try {
      const res = await fetch("/api/admin/linkedin-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "posted" }),
      });
      const data = await res.json();
      if (res.ok) setPosts((prev) => prev.map((p) => p._id === id ? data.post : p));
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch("/api/admin/linkedin-posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {}
  }

  async function handleDisconnect(profileKey: string) {
    if (!confirm(`Disconnect ${PROFILE_LABELS[profileKey] || profileKey}?`)) return;
    try {
      const res = await fetch("/api/admin/linkedin-accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileKey }),
      });
      if (res.ok) setAccounts((prev) => prev.filter((a) => a.profileKey !== profileKey));
    } catch {}
  }

  function handleCopy(post: LinkedInPostItem) {
    navigator.clipboard.writeText(post.content);
    setCopied(post._id);
    setTimeout(() => setCopied(null), 2000);
  }

  const hasSecondProfile = accounts.some((a) => a.profileKey === "personal2" && a.connected);

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

  const scheduled = posts
    .filter((p) => p.status === "scheduled" || p.status === "publishing")
    .sort((a, b) => new Date(a.scheduledFor ?? 0).getTime() - new Date(b.scheduledFor ?? 0).getTime());
  const failed = posts.filter((p) => p.status === "failed");
  const drafts = posts.filter((p) => p.status === "draft");
  const posted = posts.filter((p) => p.status === "posted");

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
                Admin
              </Link>
              <span className="text-gray-300">/</span>
              <h1 className="text-lg font-bold text-gray-900">Content</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{scheduled.length} scheduled</span>
              {failed.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-red-500">{failed.length} failed</span>
                </>
              )}
              <span>·</span>
              <span>{posted.length} posted</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Connected Accounts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">LinkedIn Accounts</h3>
            <div className="flex flex-col gap-2">
              {(["personal1", "personal2"] as const).filter((key) => key === "personal1" || hasSecondProfile).map((key) => {
                const account = accounts.find((a) => a.profileKey === key);
                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className={`w-2 h-2 rounded-full ${account?.connected ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-sm font-medium text-gray-700">{PROFILE_LABELS[key]}</span>
                      {account?.connected && (
                        <span className="text-xs text-gray-400">{account.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {account?.connected && (
                        <button
                          onClick={() => handleDisconnect(key)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )}
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
                  </div>
                );
              })}
            </div>
            {!hasSecondProfile && (
              <a
                href="/api/admin/linkedin-auth?profile=personal2"
                className="mt-1 inline-block text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                + Add a second profile (optional)
              </a>
            )}
          </div>

          {/* Generate */}
          <button
            onClick={openJobPicker}
            disabled={generating}
            className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer border-2 border-black ${
              generating
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                : "bg-green-300 text-black shadow-[0_4px_0_0_#000] hover:shadow-[0_2px_0_0_#000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
            }`}
          >
            {generating ? "Generating..." : "Generate Post from Jobs"}
          </button>

          {/* Daily job spotlights */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Daily job spotlights</h3>
              <p className="mt-1 text-xs text-gray-400">
                One post per job, newest unposted jobs first. Times are your local time. Review the drafts, then schedule them.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {slotTimes.map((t, i) => (
                <label key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Post {i + 1}</span>
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => setSlotTimes((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Days</span>
                <select
                  value={spotlightDays}
                  onChange={(e) => setSpotlightDays(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400"
                >
                  {[1, 2, 3].map((d) => (
                    <option key={d} value={d}>
                      {d} day{d > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={draftSpotlightPosts}
                disabled={spotlightBusy !== ""}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {spotlightBusy === "drafting" ? "Drafting..." : "Draft posts"}
              </button>
            </div>
            {spotlightMsg && <p className="text-xs text-gray-600">{spotlightMsg}</p>}
            {spotlights.length > 0 && (
              <div className="flex flex-col gap-3">
                {spotlights.map((s, i) => (
                  <div key={s.slug} className="rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-amber-700">Posts {formatWhen(s.when)}</p>
                      <button
                        onClick={() => setSpotlights((prev) => prev.filter((_, j) => j !== i))}
                        className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={s.content}
                      onChange={(e) => setSpotlights((prev) => prev.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))}
                      rows={10}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-gray-400 font-mono leading-relaxed"
                    />
                    <p className={`text-[11px] ${s.content.length > MAX_CHARS ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                      {s.content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                    </p>
                  </div>
                ))}
                <button
                  onClick={scheduleSpotlights}
                  disabled={spotlightBusy !== "" || spotlights.some((s) => s.content.length > MAX_CHARS || !s.content.trim())}
                  className="self-start px-5 py-2 rounded-lg text-sm font-semibold bg-green-300 text-black border-2 border-black shadow-[0_3px_0_0_#000] hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#000] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {spotlightBusy === "scheduling" ? "Scheduling..." : `Schedule all ${spotlights.length}`}
                </button>
              </div>
            )}
          </div>

          {/* Job Picker */}
          {showJobPicker && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Select Jobs to Include</h3>
                <button
                  onClick={() => setShowJobPicker(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-400">Pick specific jobs or skip to auto-select the latest 5.</p>
              {loadingJobs ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                  {availableJobs.map((job) => (
                    <label
                      key={job.slug}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        selectedSlugs.has(job.slug) ? "bg-green-50 border border-green-200" : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSlugs.has(job.slug)}
                        onChange={() => toggleSlug(job.slug)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer accent-green-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleGenerate(Array.from(selectedSlugs))}
                  disabled={selectedSlugs.size === 0}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generate with {selectedSlugs.size} selected
                </button>
                <button
                  onClick={() => handleGenerate()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Skip - use latest 5
                </button>
              </div>
            </div>
          )}

          {/* Editor */}
          {editingPost && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  {editingPost._id ? "Edit Post" : "New Post"}
                </h3>
                <button
                  onClick={() => { setEditingPost(null); setEditContent(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              {hasSecondProfile && <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Profile</label>
                <div className="flex gap-2">
                  {(["personal1", "personal2"] as const).map((p) => (
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
              </div>}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={16}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-y font-mono leading-relaxed"
                placeholder="Post content..."
              />
              {/* AI Refine */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
                  placeholder="Ask AI to change the post... (e.g. make it shorter, add more emojis)"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !aiInstruction.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {refining ? "Refining..." : "Refine"}
                </button>
              </div>
              <p
                role={editContent.length > MAX_CHARS ? "alert" : undefined}
                className={`text-xs ${editContent.length > MAX_CHARS ? "text-red-600 font-semibold" : editContent.length > MAX_CHARS - 200 ? "text-amber-600" : "text-gray-400"}`}
              >
                {editContent.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                {editContent.length > MAX_CHARS &&
                  ` · shorten by ${(editContent.length - MAX_CHARS).toLocaleString()} to post (LinkedIn's limit)`}
              </p>
              <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-3 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Publish at (your local time)</span>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    min={toLocalInput(new Date())}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave("draft")}
                    disabled={saving || !editContent.trim() || editContent.length > MAX_CHARS}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={() => handleSave("scheduled")}
                    disabled={saving || !editContent.trim() || editContent.length > MAX_CHARS || !scheduleAt}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Schedule"}
                  </button>
                </div>
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            </div>
          )}

          {/* Scheduled */}
          {scheduled.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Scheduled</h3>
              <div className="flex flex-col gap-2">
                {scheduled.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    accounts={accounts}
                    copied={copied}
                    publishing={publishing}
                    onCopy={handleCopy}
                    onEdit={() => openEditor(post)}
                    onUnschedule={handleUnschedule}
                    onPublish={handlePublish}
                    onMarkPosted={handleMarkPosted}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {failed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Failed</h3>
              <div className="flex flex-col gap-2">
                {failed.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    accounts={accounts}
                    copied={copied}
                    publishing={publishing}
                    onCopy={handleCopy}
                    onEdit={() => openEditor(post)}
                    onUnschedule={handleUnschedule}
                    onPublish={handlePublish}
                    onMarkPosted={handleMarkPosted}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Drafts */}
          {drafts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Drafts</h3>
              <div className="flex flex-col gap-2">
                {drafts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    accounts={accounts}
                    copied={copied}
                    publishing={publishing}
                    onCopy={handleCopy}
                    onEdit={() => openEditor(post)}
                    onUnschedule={handleUnschedule}
                    onPublish={handlePublish}
                    onMarkPosted={handleMarkPosted}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Posted */}
          {posted.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Posted</h3>
              <div className="flex flex-col gap-2">
                {posted.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    accounts={accounts}
                    copied={copied}
                    publishing={publishing}
                    onCopy={handleCopy}
                    onEdit={() => openEditor(post)}
                    onUnschedule={handleUnschedule}
                    onPublish={handlePublish}
                    onMarkPosted={handleMarkPosted}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {posts.length === 0 && !editingPost && (
            <p className="text-sm text-gray-400 py-8 text-center">
              No posts yet. Generate your first one!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function PostCard({
  post,
  accounts,
  copied,
  publishing,
  onCopy,
  onEdit,
  onUnschedule,
  onPublish,
  onMarkPosted,
  onDelete,
}: {
  post: LinkedInPostItem;
  accounts: { profileKey: string; name: string; connected: boolean }[];
  copied: string | null;
  publishing: string | null;
  onCopy: (post: LinkedInPostItem) => void;
  onEdit: () => void;
  onUnschedule: (id: string) => void;
  onPublish: (id: string) => void;
  onMarkPosted: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColor =
    post.status === "posted"
      ? "text-green-600 bg-green-50"
      : post.status === "scheduled" || post.status === "publishing"
        ? "text-amber-600 bg-amber-50"
        : post.status === "failed"
          ? "text-red-600 bg-red-50"
          : "text-gray-500 bg-gray-100";

  const connectedCount = accounts.filter((a) => a.connected).length;
  const busy = post.status === "publishing";
  const canPublish = post.status !== "posted" && !busy && connectedCount > 0;

  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor}`}>
            {post.status}
          </span>
          {accounts.some((a) => a.profileKey === "personal2" && a.connected) && (
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {PROFILE_LABELS[post.profile]}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap">
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      {post.status === "scheduled" && post.scheduledFor && (
        <p className="mb-2 text-xs font-semibold text-amber-700">Posts {formatWhen(post.scheduledFor)}</p>
      )}
      {post.status === "posted" && post.postedAt && (
        <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-green-700">
          <span>Posted {formatWhen(post.postedAt)}</span>
          {post.publishedUrns?.map((urn, i) => (
            <a
              key={urn}
              href={`https://www.linkedin.com/feed/update/${urn}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-green-900"
            >
              View on LinkedIn{post.publishedUrns && post.publishedUrns.length > 1 ? ` (${i + 1})` : ""}
            </a>
          ))}
        </p>
      )}
      {post.status === "failed" && post.lastError && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{post.lastError}</p>
      )}
      <p className="text-xs text-gray-600 line-clamp-5 whitespace-pre-wrap mb-3 leading-relaxed">
        {post.content}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onCopy(post)}
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
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Edit
        </button>
        {canPublish && (
          <button
            onClick={() => onPublish(post._id)}
            disabled={publishing === post._id}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            {publishing === post._id
              ? "Publishing..."
              : post.status === "failed" ? "Retry now" : "Publish now"}
          </button>
        )}
        {post.status === "scheduled" && (
          <button
            onClick={() => onUnschedule(post._id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Unschedule
          </button>
        )}
        {post.status !== "posted" && !busy && (
          <button
            onClick={() => onMarkPosted(post._id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
          >
            Mark Posted
          </button>
        )}
        <button
          onClick={() => onDelete(post._id)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
