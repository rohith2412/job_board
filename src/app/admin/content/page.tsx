"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const ADMIN_EMAIL = "rohithra75@gmail.com";

interface LinkedInPostItem {
  _id: string;
  content: string;
  profile: "personal1" | "personal2";
  status: "draft" | "scheduled" | "posted";
  jobSlugs: string[];
  scheduledFor?: string;
  postedAt?: string;
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

  const [showJobPicker, setShowJobPicker] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<{ slug: string; title: string; company: string; location: string }[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loadingJobs, setLoadingJobs] = useState(false);

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

  async function handleSave() {
    if (!editContent.trim()) return;
    try {
      if (editingPost?._id) {
        const res = await fetch("/api/admin/linkedin-posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPost._id, content: editContent, profile: editProfile }),
        });
        const data = await res.json();
        if (res.ok) setPosts((prev) => prev.map((p) => p._id === editingPost._id ? data.post : p));
      } else {
        const res = await fetch("/api/admin/linkedin-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent, profile: editProfile, status: "scheduled", jobSlugs: editingPost?.jobSlugs || [] }),
        });
        const data = await res.json();
        if (res.ok) setPosts((prev) => [data.post, ...prev]);
      }
      setEditingPost(null);
      setEditContent("");
    } catch {}
  }

  async function handlePublish(postId: string) {
    const connectedCount = accounts.filter((a) => a.connected).length;
    const connectedNames = accounts.filter((a) => a.connected).map((a) => a.name).join(", ");
    if (!confirm(`Publish to ${connectedCount} account${connectedCount !== 1 ? "s" : ""} (${connectedNames})?`)) return;
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

  const scheduled = posts.filter((p) => p.status === "scheduled");
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
              {(["personal1", "personal2"] as const).map((key) => {
                const account = accounts.find((a) => a.profileKey === key);
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
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
                  Skip — use latest 5
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
              <div>
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
              </div>
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
              <div className="flex items-center justify-between">
                <p className={`text-[10px] ${editContent.length > 3000 ? "text-red-500 font-semibold" : editContent.length > 2800 ? "text-amber-500" : "text-gray-400"}`}>
                  {editContent.length} / 3000 characters{editContent.length > 3000 ? " — will be truncated by LinkedIn!" : ""}
                </p>
                <button
                  onClick={handleSave}
                  disabled={!editContent.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPost._id ? "Update" : "Save to Queue"}
                </button>
              </div>
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
                    onEdit={() => { setEditingPost(post); setEditContent(post.content); setEditProfile(post.profile); }}
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
                    onEdit={() => { setEditingPost(post); setEditContent(post.content); setEditProfile(post.profile); }}
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
                    onEdit={() => { setEditingPost(post); setEditContent(post.content); setEditProfile(post.profile); }}
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
  onPublish: (id: string) => void;
  onMarkPosted: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColor =
    post.status === "posted"
      ? "text-green-600 bg-green-50"
      : post.status === "scheduled"
        ? "text-amber-600 bg-amber-50"
        : "text-gray-500 bg-gray-100";

  const connectedCount = accounts.filter((a) => a.connected).length;
  const canPublish = post.status !== "posted" && connectedCount > 0;

  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
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
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
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
            {publishing === post._id ? "Publishing..." : `Publish to ${connectedCount} account${connectedCount !== 1 ? "s" : ""}`}
          </button>
        )}
        {post.status !== "posted" && (
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
