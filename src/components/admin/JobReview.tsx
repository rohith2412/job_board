"use client";

import { useEffect, useMemo, useState } from "react";

type Candidate = {
  _id: string;
  ats: string;
  company: string;
  title: string;
  location: string;
  applyUrl: string;
  salary: string;
  postedAt?: string;
  firstSeenAt: string;
  description: string;
};

type Kind = "all" | "intern" | "coop" | "newgrad";
type Region = "all" | "canada" | "us";

const KIND_TEST: Record<Exclude<Kind, "all">, RegExp> = {
  intern: /intern/i,
  coop: /co-?op/i,
  newgrad: /new grad|graduate|early career|entry|junior|campus|university/i,
};
const CANADA = /canada|ontario|quebec|british columbia|alberta|toronto|waterloo|vancouver|montr[ée]al|ottawa|calgary|edmonton|(,|\s)(ON|BC|QC|AB|MB|NS)\b/i;

function ago(iso?: string) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
}

export default function JobReview() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({ approved: 0, rejected: 0, lastCheckedAt: null as string | null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"" | "sync" | "approve" | "reject">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [region, setRegion] = useState<Region>("all");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/admin/job-candidates", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.candidates);
      setStats({ approved: data.approved, rejected: data.rejected, lastCheckedAt: data.lastCheckedAt });
    } else {
      setMessage("Couldn't load roles. Try refreshing.");
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/job-candidates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setItems(data.candidates);
        setStats({ approved: data.approved, rejected: data.rejected, lastCheckedAt: data.lastCheckedAt });
      })
      .catch(() => !cancelled && setMessage("Couldn't load roles. Try refreshing."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (c) =>
        (!q || `${c.title} ${c.company} ${c.location}`.toLowerCase().includes(q)) &&
        (kind === "all" || KIND_TEST[kind].test(c.title)) &&
        (region === "all" || (region === "canada" ? CANADA.test(c.location) : !CANADA.test(c.location) || /united states|usa|\bUS\b/i.test(c.location)))
    );
  }, [items, query, kind, region]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function act(action: "approve" | "reject", ids: string[]) {
    if (!ids.length) return;
    setBusy(action);
    setMessage("");
    try {
      const res = await fetch("/api/admin/job-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const done = new Set<string>(
        action === "approve" ? [...data.approved.map((a: { id: string }) => a.id), ...data.failed.map((f: { id: string }) => f.id)] : ids
      );
      setItems((prev) => prev.filter((c) => !done.has(c._id)));
      setSelected((prev) => new Set([...prev].filter((id) => !done.has(id))));
      if (action === "approve") {
        setStats((s) => ({ ...s, approved: s.approved + data.approved.length }));
        setMessage(
          `Added ${data.approved.length} job${data.approved.length === 1 ? "" : "s"} to Reblet` +
            (data.failed.length ? `. Skipped ${data.failed.length}: ${data.failed[0].error}` : "")
        );
      } else {
        setStats((s) => ({ ...s, rejected: s.rejected + data.rejected }));
        setMessage(`Skipped ${data.rejected}`);
      }
    } catch (err) {
      setMessage(err instanceof Error && err.message ? err.message : "Something went wrong");
    }
    setBusy("");
  }

  async function sync() {
    setBusy("sync");
    setMessage("Checking company job boards. This takes about a minute...");
    try {
      const res = await fetch("/api/admin/job-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Checked ${data.companies} companies. ${data.added} new role${data.added === 1 ? "" : "s"} to review.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error && err.message ? err.message : "Check failed");
    }
    setBusy("");
  }

  const ids = shown.map((c) => c._id);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const chosen = [...selected];

  return (
    <div className="flex flex-col gap-3 px-4 py-4 pb-28 sm:px-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">New roles to review</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Intern, co-op and new grad software roles from company job boards, checked every morning.
              {stats.lastCheckedAt && ` Last checked ${ago(stats.lastCheckedAt)}.`}
            </p>
          </div>
          <button
            onClick={sync}
            disabled={busy !== ""}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            {busy === "sync" ? "Checking..." : "Check now"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-gray-50 py-2">
            <p className="text-lg font-bold text-gray-900 tabular-nums">{items.length}</p>
            <p className="text-[11px] text-gray-500">to review</p>
          </div>
          <div className="rounded-xl bg-green-50 py-2">
            <p className="text-lg font-bold text-green-800 tabular-nums">{stats.approved}</p>
            <p className="text-[11px] text-green-700">added</p>
          </div>
          <div className="rounded-xl bg-gray-50 py-2">
            <p className="text-lg font-bold text-gray-900 tabular-nums">{stats.rejected}</p>
            <p className="text-[11px] text-gray-500">skipped</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, company or city"
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {(
            [
              ["all", "All roles"],
              ["intern", "Internships"],
              ["coop", "Co-op"],
              ["newgrad", "New grad"],
            ] as const
          ).map(([k, label]) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-gray-200" />
          {(
            [
              ["all", "US + Canada"],
              ["canada", "Canada"],
              ["us", "US"],
            ] as const
          ).map(([k, label]) => (
            <Chip key={k} active={region === k} onClick={() => setRegion(k)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {message && <p className="rounded-xl bg-gray-900 px-3.5 py-2.5 text-xs text-white">{message}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-400">
          {items.length ? "No roles match these filters." : "Nothing to review. New roles show up here after the morning check."}
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 px-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
              className="h-4 w-4 accent-green-600"
            />
            Select all {shown.length}
          </label>
          <ul className="flex flex-col gap-2">
            {shown.map((c) => (
              <li key={c._id} className={`rounded-2xl border bg-white p-3.5 ${selected.has(c._id) ? "border-green-300 ring-1 ring-green-200" : "border-gray-100"}`}>
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c._id)}
                    onChange={() => toggle(c._id)}
                    aria-label={`Select ${c.title}`}
                    className="mt-1 h-5 w-5 shrink-0 accent-green-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{c.company}</p>
                    <p className="text-sm font-semibold leading-snug text-gray-900">{c.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {c.location}
                      {c.salary ? ` · ${c.salary}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {c.postedAt ? `Posted ${ago(c.postedAt)}` : `Found ${ago(c.firstSeenAt)}`}
                    </p>
                    {open === c._id && c.description && (
                      <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-2.5 text-xs leading-relaxed text-gray-600">{c.description}…</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => act("approve", [c._id])}
                        disabled={busy !== ""}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer disabled:opacity-50"
                      >
                        Add to Reblet
                      </button>
                      <button
                        onClick={() => act("reject", [c._id])}
                        disabled={busy !== ""}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                      >
                        Skip
                      </button>
                      {c.description && (
                        <button onClick={() => setOpen(open === c._id ? null : c._id)} className="px-1 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer">
                          {open === c._id ? "Hide details" : "Details"}
                        </button>
                      )}
                      <a href={c.applyUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-medium text-green-700 hover:text-green-800">
                        Posting ↗
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pt-3 backdrop-blur pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-4xl items-center gap-2">
            <span className="flex-1 text-sm font-medium text-gray-700">{chosen.length} selected</span>
            <button
              onClick={() => act("reject", chosen)}
              disabled={busy !== ""}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 cursor-pointer disabled:opacity-50"
            >
              Skip
            </button>
            <button
              onClick={() => act("approve", chosen)}
              disabled={busy !== ""}
              className="rounded-xl border-2 border-black bg-green-300 px-4 py-2 text-sm font-semibold text-black shadow-[0_3px_0_0_#000] cursor-pointer disabled:opacity-50"
            >
              {busy === "approve" ? "Adding..." : `Add ${chosen.length}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
        active ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}
