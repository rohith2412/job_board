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

  const [availableJobs, setAvailableJobs] = useState<{ slug: string; title: string; company: string; location: string }[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [slotTimes, setSlotTimes] = useState(["08:00", "11:00", "14:00", "17:00", "20:00"]);
  const [spotlightDays, setSpotlightDays] = useState(1);
  const [spotlights, setSpotlights] = useState<{ slug: string; title: string; content: string; when: string }[]>([]);
  const [spotlightBusy, setSpotlightBusy] = useState<"" | "drafting" | "scheduling">("");
  const [spotlightMsg, setSpotlightMsg] = useState("");

  const [view, setView] = useState<"queue" | "drafts" | "posted">("queue");
  const [createTab, setCreateTab] = useState<"spotlights" | "roundup">("spotlights");
  const [now, setNow] = useState(0);

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

  // Keeps countdowns current.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!editingPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingPost(null);
        setEditContent("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingPost]);

  function closeEditor() {
    setEditingPost(null);
    setEditContent("");
  }

  async function openJobPicker() {
    setLoadingJobs(true);
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
  const posted = posts
    .filter((p) => p.status === "posted")
    .sort((a, b) => new Date(b.postedAt ?? b.createdAt).getTime() - new Date(a.postedAt ?? a.createdAt).getTime());

  const primary = accounts.find((a) => a.profileKey === "personal1");
  const accountName = primary?.connected ? primary.name : "LinkedIn";
  const next = scheduled.find((p) => p.scheduledFor);
  const last = scheduled.at(-1);
  const coverageMs = last?.scheduledFor ? new Date(last.scheduledFor).getTime() - now : 0;
  const lowQueue = scheduled.length === 0 || coverageMs < DAY_MS;

  const cardProps = {
    accountName,
    canPublish: accounts.some((a) => a.connected),
    showProfile: hasSecondProfile,
    copied,
    publishing,
    onCopy: handleCopy,
    onUnschedule: handleUnschedule,
    onPublish: handlePublish,
    onMarkPosted: handleMarkPosted,
    onDelete: handleDelete,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              aria-label="Back to admin"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">LinkedIn content</h1>
              <p className="text-xs text-gray-500">Schedule job posts and track what went out</p>
            </div>
          </div>
          <AccountMenu
            account={primary}
            hasSecondProfile={hasSecondProfile}
            secondName={accounts.find((a) => a.profileKey === "personal2")?.name}
            onDisconnect={handleDisconnect}
          />
        </header>

        <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
          {/* Overview */}
          <section className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
            <div className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border-2 border-black bg-green-300 p-5 shadow-[0_4px_0_0_#000]">
              {next?.scheduledFor ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-950/70">Next post</span>
                    <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                      {relative(new Date(next.scheduledFor).getTime() - now)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tracking-tight text-black">{formatWhen(next.scheduledFor)}</p>
                    <p className="mt-1 truncate text-sm text-green-950/80">{next.content.split("\n").find((l) => l.trim())}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-950/70">Next post</span>
                  <div>
                    <p className="text-2xl font-bold tracking-tight text-black">Nothing scheduled</p>
                    <p className="mt-1 text-sm text-green-950/80">Draft spotlights below to fill the queue.</p>
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1 md:grid-rows-3">
              <Stat label="Scheduled" value={scheduled.length} hint={last?.scheduledFor ? `through ${shortDay(last.scheduledFor)}` : "queue empty"} tone={lowQueue ? "warn" : "default"} />
              <Stat label="Posted" value={posted.length} hint={posted[0]?.postedAt ? `last ${shortDay(posted[0].postedAt)}` : "none yet"} />
              <Stat label="Drafts" value={drafts.length + failed.length} hint={failed.length ? `${failed.length} failed` : "unscheduled"} tone={failed.length ? "bad" : "default"} />
            </div>
          </section>

          {lowQueue && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              {scheduled.length === 0
                ? "The queue is empty, so nothing will post. Draft a few days of spotlights below."
                : `The queue runs out ${relative(coverageMs)}. Draft more spotlights to keep posting daily.`}
            </p>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Posts */}
            <section className="flex min-w-0 flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div role="tablist" aria-label="Posts" className="inline-flex rounded-xl bg-gray-200/70 p-1">
                  {([
                    ["queue", "Queue", scheduled.length + failed.length],
                    ["drafts", "Drafts", drafts.length],
                    ["posted", "Posted", posted.length],
                  ] as const).map(([key, label, n]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={view === key}
                      onClick={() => setView(key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                        view === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {label}
                      <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${view === key ? "bg-gray-100 text-gray-600" : "text-gray-400"}`}>{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              {view === "queue" && (
                <div className="flex flex-col gap-5">
                  {failed.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500">Needs attention</h3>
                      {failed.map((post) => (
                        <PostCard key={post._id} post={post} onEdit={() => openEditor(post)} {...cardProps} />
                      ))}
                    </div>
                  )}
                  {groupByDay(scheduled, now).map(([label, items]) => (
                    <div key={label} className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
                      <ol className="flex flex-col gap-2">
                        {items.map((post) => (
                          <li key={post._id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                            <div className="pt-4 text-right">
                              <p className="text-sm font-semibold text-gray-900 tabular-nums">{timeOf(post.scheduledFor!)}</p>
                              <p className="text-[11px] text-gray-400">{relative(new Date(post.scheduledFor!).getTime() - now)}</p>
                            </div>
                            <PostCard post={post} onEdit={() => openEditor(post)} compact {...cardProps} />
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                  {scheduled.length === 0 && failed.length === 0 && <Empty text="Nothing in the queue. Draft spotlights to schedule the next few days." />}
                </div>
              )}

              {view === "drafts" && (
                <div className="flex flex-col gap-2">
                  {drafts.map((post) => (
                    <PostCard key={post._id} post={post} onEdit={() => openEditor(post)} {...cardProps} />
                  ))}
                  {drafts.length === 0 && <Empty text="No drafts. Posts you save without a time show up here." />}
                </div>
              )}

              {view === "posted" && (
                <div className="flex flex-col gap-2">
                  {posted.map((post) => (
                    <PostCard key={post._id} post={post} onEdit={() => openEditor(post)} {...cardProps} />
                  ))}
                  {posted.length === 0 && <Empty text="Nothing posted yet." />}
                </div>
              )}
            </section>

            {/* Create */}
            <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
              <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex border-b border-gray-100 p-1.5">
                  {([
                    ["spotlights", "Daily spotlights"],
                    ["roundup", "Roundup post"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCreateTab(key);
                        if (key === "roundup" && availableJobs.length === 0 && !loadingJobs) openJobPicker();
                      }}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        createTab === key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {createTab === "spotlights" ? (
                  <div className="flex flex-col gap-4 p-4">
                    <p className="text-xs leading-relaxed text-gray-500">
                      One post per job, newest unposted jobs first. Each post fills the next open time slot. Times are your local time.
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-500">Posting times</span>
                      <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200">
                        {slotTimes.map((t, i) => (
                          <label key={i} className="flex items-center justify-between gap-3 px-3 py-1.5">
                            <span className="text-sm text-gray-600">Post {i + 1}</span>
                            <input
                              type="time"
                              value={t}
                              onChange={(e) => setSlotTimes((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                              className="rounded-lg px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-500">How many days</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((d) => (
                          <button
                            key={d}
                            onClick={() => setSpotlightDays(d)}
                            className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors cursor-pointer ${
                              spotlightDays === d ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {d} day{d > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={draftSpotlightPosts}
                      disabled={spotlightBusy !== ""}
                      className="rounded-full border-2 border-black bg-green-300 py-2.5 text-sm font-semibold text-black shadow-[0_3px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#000] active:translate-y-[3px] active:shadow-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {spotlightBusy === "drafting"
                        ? "Writing drafts..."
                        : `Draft ${slotTimes.filter(Boolean).length * spotlightDays} posts`}
                    </button>
                    {spotlightMsg && <p className="text-xs text-gray-600">{spotlightMsg}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 p-4">
                    <p className="text-xs leading-relaxed text-gray-500">One post listing several jobs. Pick the jobs, then edit and schedule it.</p>
                    {loadingJobs ? (
                      <div className="flex justify-center py-6">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
                      </div>
                    ) : (
                      <div className="-mx-1 flex max-h-72 flex-col gap-1 overflow-y-auto px-1">
                        {availableJobs.map((job) => (
                          <label
                            key={job.slug}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                              selectedSlugs.has(job.slug) ? "border-green-300 bg-green-50" : "border-transparent hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSlugs.has(job.slug)}
                              onChange={() => toggleSlug(job.slug)}
                              className="h-4 w-4 cursor-pointer accent-green-600"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-800">{job.title}</span>
                              <span className="block truncate text-[11px] text-gray-400">
                                {job.company}
                                {job.location ? ` · ${job.location}` : ""}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerate(Array.from(selectedSlugs))}
                        disabled={selectedSlugs.size === 0 || generating}
                        className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {generating ? "Writing..." : `Write with ${selectedSlugs.size}`}
                      </button>
                      <button
                        onClick={() => handleGenerate()}
                        disabled={generating}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                      >
                        Latest 5
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spotlight review */}
              {spotlights.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Review {spotlights.length} drafts</h3>
                    <button onClick={() => setSpotlights([])} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">
                      Discard all
                    </button>
                  </div>
                  <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
                    {spotlights.map((s, i) => (
                      <div key={s.slug} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-800">{formatWhen(s.when)}</span>
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
                          rows={9}
                          className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-800 focus:border-gray-400 focus:outline-none"
                        />
                        <CharCount n={s.content.length} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={scheduleSpotlights}
                    disabled={spotlightBusy !== "" || spotlights.some((s) => s.content.length > MAX_CHARS || !s.content.trim())}
                    className="rounded-full border-2 border-black bg-green-300 py-2.5 text-sm font-semibold text-black shadow-[0_3px_0_0_#000] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_0_0_#000] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {spotlightBusy === "scheduling" ? "Scheduling..." : `Schedule all ${spotlights.length}`}
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Editor */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={closeEditor}>
          <div
            role="dialog"
            aria-label={editingPost._id ? "Edit post" : "New post"}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-base font-semibold text-gray-900">{editingPost._id ? "Edit post" : "New post"}</h2>
              <button onClick={closeEditor} aria-label="Close" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_400px]">
              <div className="flex min-w-0 flex-col gap-3 p-5">
                {hasSecondProfile && (
                  <div className="flex gap-2">
                    {(["personal1", "personal2"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditProfile(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          editProfile === p ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {PROFILE_LABELS[p]}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={14}
                  className="w-full flex-1 resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
                  placeholder="Write the post..."
                />
                <div className="flex items-center justify-between gap-3">
                  <CharCount n={editContent.length} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRefine();
                      }
                    }}
                    placeholder="Ask AI to change it, e.g. make it shorter"
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={handleRefine}
                    disabled={refining || !aiInstruction.trim()}
                    className="whitespace-nowrap rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {refining ? "Rewriting..." : "Rewrite"}
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-50 p-5 md:border-l md:border-t-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Preview</p>
                <LinkedInPreview content={editContent} name={accountName} />
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <span className="whitespace-nowrap">Post at</span>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  min={toLocalInput(new Date(now))}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="min-w-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-gray-400 focus:outline-none"
                />
              </label>
              <div className="flex items-center gap-2">
                {saveError && <p className="mr-1 text-sm text-red-600">{saveError}</p>}
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving || !editContent.trim() || editContent.length > MAX_CHARS}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save draft
                </button>
                <button
                  onClick={() => handleSave("scheduled")}
                  disabled={saving || !editContent.trim() || editContent.length > MAX_CHARS || !scheduleAt}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function relative(ms: number) {
  const past = ms < 0;
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60000);
  const text =
    mins < 1 ? "now" : mins < 60 ? `${mins}m` : mins < 24 * 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${Math.round(mins / (24 * 60))} days`;
  if (text === "now") return "now";
  return past ? `${text} ago` : `in ${text}`;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function shortDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(items: LinkedInPostItem[], now: number): [string, LinkedInPostItem[]][] {
  const key = (d: Date) => d.toDateString();
  const today = key(new Date(now));
  const tomorrow = key(new Date(now + DAY_MS));
  const groups = new Map<string, LinkedInPostItem[]>();
  for (const p of items) {
    const d = new Date(p.scheduledFor ?? p.createdAt);
    const label = key(d) === today ? "Today" : key(d) === tomorrow ? "Tomorrow" : shortDay(d.toISOString());
    groups.set(label, [...(groups.get(label) ?? []), p]);
  }
  return [...groups.entries()];
}

function Stat({ label, value, hint, tone = "default" }: { label: string; value: number; hint: string; tone?: "default" | "warn" | "bad" }) {
  const hintColor = tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-600" : "text-gray-400";
  return (
    <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="md:text-right">
        <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className={`truncate text-[11px] ${hintColor}`}>{hint}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{text}</p>;
}

function CharCount({ n }: { n: number }) {
  const over = n > MAX_CHARS;
  return (
    <p role={over ? "alert" : undefined} className={`text-[11px] tabular-nums ${over ? "font-semibold text-red-600" : n > MAX_CHARS - 200 ? "text-amber-600" : "text-gray-400"}`}>
      {n.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters{over ? ` · ${(n - MAX_CHARS).toLocaleString()} over LinkedIn's limit` : ""}
    </p>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-black bg-green-300 font-bold text-black"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials || "in"}
    </span>
  );
}

// Renders post text the way LinkedIn does: links and hashtags in blue, long posts folded behind "see more".
function LinkedInPreview({ content, name }: { content: string; name: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split("\n");
  const folded = !expanded && (lines.length > 3 || content.length > 210);
  const shown = folded ? lines.slice(0, 3).join("\n").slice(0, 210) : content;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-[11px] text-gray-500">Founder at Reblet · now · 🌐</p>
        </div>
      </div>
      {content.trim() ? (
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-900">
          {highlight(shown)}
          {folded && (
            <button onClick={() => setExpanded(true)} className="text-gray-500 hover:underline cursor-pointer">
              …see more
            </button>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-400">Your post preview shows up here.</p>
      )}
    </div>
  );
}

function highlight(text: string) {
  return text.split(/(https?:\/\/\S+|#\w+)/g).map((part, i) =>
    /^(https?:\/\/|#\w)/.test(part) ? (
      <span key={i} className="font-semibold text-[#0a66c2]">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function AccountMenu({
  account,
  hasSecondProfile,
  secondName,
  onDisconnect,
}: {
  account?: { profileKey: string; name: string; connected: boolean };
  hasSecondProfile: boolean;
  secondName?: string;
  onDisconnect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const connected = account?.connected;
  if (!connected) {
    return (
      <a
        href="/api/admin/linkedin-auth?profile=personal1"
        className="rounded-full border-2 border-black bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_0_#000]"
      >
        Connect LinkedIn
      </a>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm transition-colors hover:border-gray-300 cursor-pointer"
      >
        <Avatar name={account.name} size={28} />
        <span className="font-medium text-gray-800">{account.name}</span>
        <span className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-1.5 text-sm shadow-lg">
            <p className="px-3 py-2 text-xs text-gray-500">Posting as {account.name}{hasSecondProfile && secondName ? ` and ${secondName}` : ""}</p>
            <a href="/api/admin/linkedin-auth?profile=personal1" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
              Reconnect
            </a>
            {hasSecondProfile ? (
              <button onClick={() => onDisconnect("personal2")} className="block w-full rounded-lg px-3 py-2 text-left text-gray-700 hover:bg-gray-50 cursor-pointer">
                Remove second profile
              </button>
            ) : (
              <a href="/api/admin/linkedin-auth?profile=personal2" className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
                Add a second profile (optional)
              </a>
            )}
            <button onClick={() => onDisconnect("personal1")} className="block w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer">
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({
  post,
  accountName,
  canPublish: anyAccount,
  showProfile,
  compact = false,
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
  accountName: string;
  canPublish: boolean;
  showProfile: boolean;
  compact?: boolean;
  copied: string | null;
  publishing: string | null;
  onCopy: (post: LinkedInPostItem) => void;
  onEdit: () => void;
  onUnschedule: (id: string) => void;
  onPublish: (id: string) => void;
  onMarkPosted: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const busy = post.status === "publishing";
  const canPublish = post.status !== "posted" && !busy && anyAccount;
  const lines = post.content.split("\n");
  const title = lines.find((l) => l.trim()) ?? "";
  const rest = lines.slice(lines.indexOf(title) + 1).join("\n").trim();

  const badge =
    post.status === "posted"
      ? "bg-green-50 text-green-700"
      : post.status === "failed"
        ? "bg-red-50 text-red-700"
        : post.status === "draft"
          ? "bg-gray-100 text-gray-600"
          : "bg-amber-50 text-amber-700";

  return (
    <article className={`min-w-0 rounded-2xl border bg-white p-4 transition-colors ${post.status === "failed" ? "border-red-200" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            {!compact && <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${badge}`}>{busy ? "publishing" : post.status}</span>}
            {showProfile && <span>{PROFILE_LABELS[post.profile]}</span>}
            {post.status === "scheduled" && post.scheduledFor && !compact && <span>Posts {formatWhen(post.scheduledFor)}</span>}
            {busy && compact && <span className="font-semibold text-amber-700">Publishing…</span>}
            {post.status === "posted" && post.postedAt && <span>Posted {formatWhen(post.postedAt)}</span>}
            {post.status === "draft" && <span>Saved {formatWhen(post.createdAt)}</span>}
            {post.status === "posted" &&
              post.publishedUrns?.map((urn, i) => (
                <a
                  key={urn}
                  href={`https://www.linkedin.com/feed/update/${urn}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#0a66c2] hover:underline"
                >
                  View on LinkedIn{post.publishedUrns && post.publishedUrns.length > 1 ? ` (${i + 1})` : ""} ↗
                </a>
              ))}
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <button onClick={onEdit} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
            Edit
          </button>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="More actions"
            aria-expanded={menu}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-lg" onClick={() => setMenu(false)}>
                <MenuItem onClick={() => onCopy(post)}>{copied === post._id ? "Copied" : "Copy text"}</MenuItem>
                {post.status === "scheduled" && <MenuItem onClick={() => onUnschedule(post._id)}>Move to drafts</MenuItem>}
                {post.status !== "posted" && !busy && <MenuItem onClick={() => onMarkPosted(post._id)}>Mark as posted</MenuItem>}
                <MenuItem danger onClick={() => onDelete(post._id)}>Delete</MenuItem>
              </div>
            </>
          )}
        </div>
      </div>

      {post.status === "failed" && post.lastError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{post.lastError}</p>
      )}

      {rest && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-2 block w-full text-left cursor-pointer">
          <p className={`whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600 ${expanded ? "" : "line-clamp-3"}`}>{highlight(rest)}</p>
          <span className="mt-1 inline-block text-[11px] font-medium text-gray-400 hover:text-gray-700">{expanded ? "Show less" : "Show full post"}</span>
        </button>
      )}

      {canPublish && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span className="truncate text-[11px] text-gray-400">as {accountName}</span>
          <button
            onClick={() => onPublish(post._id)}
            disabled={publishing === post._id}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#004182] cursor-pointer disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {publishing === post._id ? "Publishing..." : post.status === "failed" ? "Retry now" : "Publish now"}
          </button>
        </div>
      )}
    </article>
  );
}

function MenuItem({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left cursor-pointer ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
    >
      {children}
    </button>
  );
}
