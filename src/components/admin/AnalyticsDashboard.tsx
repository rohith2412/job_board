"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Summary = {
  pageviews: number;
  visitors: number;
  sessions: number;
  pagesPerSession: number | null;
  bounceRate: number | null;
  avgTimeOnPageSec: number | null;
  signedInUsers: number;
  applyClicks: number;
  signups: number;
};
type Named = { name: string; count: number };
type Point = {
  date: string;
  pageviews: number;
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  applyClicks: number;
  signups: number;
  prevPageviews: number;
  prevVisitors: number;
};
type UserRow = {
  email: string;
  name: string;
  image: string;
  signedUp: string;
  region: string;
  visits: number;
  visitsInRange: number;
  sessions: number;
  daysActive: number;
  firstSeen: string | null;
  lastSeen: string | null;
  topPage: string | null;
  location: string;
  device: string | null;
  timeOnSiteMin: number;
};
type Data = {
  generatedAt: string;
  rangeDays: number;
  timezone: string;
  enhancedSince: string | null;
  liveNow: number;
  summary: Summary;
  previous: Summary;
  returning: {
    visitors: number;
    returning: number;
    newVisitors: number;
    returningRate: number;
    multiDay: number;
    multiDayRate: number;
    avgLifetimeVisits: number;
    frequency: { label: string; count: number }[];
  };
  series: Point[];
  pages: { path: string; views: number; visitors: number; avgTimeSec: number | null }[];
  jobs: { slug: string; title: string; company: string; views: number; visitors: number; applyClicks: number; ctr: number | null }[];
  sources: Named[];
  campaigns: Named[];
  countries: Named[];
  cities: Named[];
  devices: Named[];
  browsers: Named[];
  operatingSystems: Named[];
  heatmap: { day: string; hours: number[] }[];
  cohorts: { week: string; size: number; retention: number[] }[];
  users: UserRow[];
};
type Journey = {
  user: { email: string; name?: string; createdAt?: string; region?: string; emailConsent?: boolean } | null;
  visits: { _id: string; path: string; createdAt: string; durationMs?: number; city?: string; country?: string; referrerHost?: string; utmCampaign?: string; device: string; browser: string; os: string; sessionId?: string }[];
  events: { _id: string; type: string; jobSlug?: string; targetHost?: string; createdAt: string }[];
};

const RANGES = [
  { days: 1, label: "24h" },
  { days: 7, label: "7d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "12m" },
];

const METRICS = [
  { key: "visitors", label: "Visitors", prev: "prevVisitors" },
  { key: "pageviews", label: "Page views", prev: "prevPageviews" },
  { key: "applyClicks", label: "Apply clicks", prev: null },
  { key: "signups", label: "Signups", prev: null },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const fmt = (n: number) => n.toLocaleString("en-US");
const shortDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const duration = (sec: number | null) => (sec == null ? "—" : sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`);

function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${name}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function Delta({ now, before, invert = false, suffix = "" }: { now: number | null; before: number | null; invert?: boolean; suffix?: string }) {
  if (now == null || before == null || before === 0) return <span className="text-[11px] text-gray-300">no prior data</span>;
  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) return <span className="text-[11px] text-gray-400">no change</span>;
  const good = invert ? change < 0 : change > 0;
  return (
    <span className={`text-[11px] font-semibold ${good ? "text-green-600" : "text-red-500"}`}>
      {change > 0 ? "▲" : "▼"} {Math.abs(change)}%{suffix}
    </span>
  );
}

function Card({ title, actions, children, className = "" }: { title: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${value === o.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BarList({ rows, total, limit = 8, onSelect }: { rows: Named[]; total?: number; limit?: number; onSelect?: (name: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, limit);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const sum = total ?? rows.reduce((s, r) => s + r.count, 0);
  if (!rows.length) return <p className="py-6 text-center text-xs text-gray-400">No data yet for this range</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {shown.map((r) => (
        <button
          key={r.name}
          onClick={() => onSelect?.(r.name)}
          className={`group relative flex items-center justify-between overflow-hidden rounded-lg px-2.5 py-1.5 text-left text-xs ${onSelect ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className="absolute inset-y-0 left-0 rounded-lg bg-green-100 transition-all group-hover:bg-green-200" style={{ width: `${(r.count / max) * 100}%` }} />
          <span className="relative truncate pr-3 font-medium text-gray-800">{r.name}</span>
          <span className="relative shrink-0 tabular-nums text-gray-600">
            {fmt(r.count)} <span className="text-gray-400">· {sum ? Math.round((r.count / sum) * 100) : 0}%</span>
          </span>
        </button>
      ))}
      {rows.length > limit && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-1 self-start text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer">
          {expanded ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

type SortDir = "asc" | "desc";
function useSorted<T>(rows: T[], initial: keyof T) {
  const [key, setKey] = useState<keyof T>(initial);
  const [dir, setDir] = useState<SortDir>("desc");
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = a[key] as unknown;
        const y = b[key] as unknown;
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
        return dir === "asc" ? cmp : -cmp;
      }),
    [rows, key, dir]
  );
  const toggle = (k: keyof T) => {
    if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(k);
      setDir("desc");
    }
  };
  const indicator = (k: keyof T) => (k === key ? (dir === "asc" ? " ↑" : " ↓") : "");
  return { sorted, toggle, indicator };
}

function Th<T>({ label, k, sort, align = "right" }: { label: string; k: keyof T; sort: { toggle: (k: keyof T) => void; indicator: (k: keyof T) => string }; align?: "left" | "right" }) {
  return (
    <th className={`whitespace-nowrap px-2 py-2 font-medium text-gray-500 ${align === "left" ? "text-left" : "text-right"}`}>
      <button onClick={() => sort.toggle(k)} className="cursor-pointer hover:text-gray-900">
        {label}
        {sort.indicator(k)}
      </button>
    </th>
  );
}

function Heatmap({ rows }: { rows: Data["heatmap"] }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.hours));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="mb-1 grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px] text-[10px] text-gray-400">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center">{h % 3 === 0 ? (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`) : ""}</span>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.day} className="mb-[3px] grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span className="text-[11px] text-gray-500">{r.day}</span>
            {r.hours.map((n, h) => (
              <span
                key={h}
                title={`${r.day} ${h}:00 — ${fmt(n)} page views`}
                className="aspect-square rounded-[3px]"
                style={{ backgroundColor: n ? `rgba(22, 163, 74, ${0.12 + (n / max) * 0.88})` : "#f3f4f6" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cohorts({ rows }: { rows: Data["cohorts"] }) {
  if (!rows.length) return <p className="py-6 text-center text-xs text-gray-400">Not enough history yet</p>;
  const width = Math.max(...rows.map((r) => r.retention.length));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500">
            <th className="px-2 py-1.5 text-left font-medium">First seen (week of)</th>
            <th className="px-2 py-1.5 text-right font-medium">Visitors</th>
            {Array.from({ length: width }, (_, i) => (
              <th key={i} className="px-1 py-1.5 text-center font-medium">{i === 0 ? "Wk 0" : `+${i}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.week}>
              <td className="px-2 py-1 text-gray-700">{shortDate(r.week)}</td>
              <td className="px-2 py-1 text-right tabular-nums text-gray-600">{fmt(r.size)}</td>
              {Array.from({ length: width }, (_, i) => {
                const v = r.retention[i];
                return (
                  <td key={i} className="px-0.5 py-0.5">
                    {v == null ? null : (
                      <span
                        className="block rounded px-1 py-1 text-center tabular-nums"
                        style={{ backgroundColor: i === 0 ? "#dcfce7" : `rgba(22, 163, 74, ${Math.min(1, 0.08 + v / 60)})`, color: v > 35 && i > 0 ? "white" : "#14532d" }}
                      >
                        {v}%
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JourneyPanel({ email, onClose }: { email: string; onClose: () => void }) {
  const [data, setData] = useState<Journey | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/analytics/user?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError("Couldn't load this user's activity"));
    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const timeline = useMemo(() => {
    if (!data) return [];
    const items = [
      ...data.visits.map((v) => ({ kind: "visit" as const, at: v.createdAt, v })),
      ...data.events.map((e) => ({ kind: "event" as const, at: e.createdAt, e })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    return items;
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Activity for ${email}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900">{data?.user?.name || email}</p>
            <p className="truncate text-xs text-gray-500">{email}</p>
            {data?.user?.createdAt && <p className="mt-1 text-xs text-gray-400">Signed up {when(data.user.createdAt)}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!data && !error && <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />}
          {data && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{fmt(data.visits.length)}</p>
                  <p className="text-[10px] text-gray-500">page views</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{new Set(data.visits.map((v) => new Date(v.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Toronto" }))).size}</p>
                  <p className="text-[10px] text-gray-500">days active</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2">
                  <p className="text-lg font-bold text-gray-900">{fmt(data.events.length)}</p>
                  <p className="text-[10px] text-gray-500">apply clicks</p>
                </div>
              </div>
              <ol className="flex flex-col gap-2">
                {timeline.map((item) =>
                  item.kind === "visit" ? (
                    <li key={item.v._id} className="rounded-lg border border-gray-100 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-gray-800">{item.v.path}</span>
                        <span className="shrink-0 text-[10px] text-gray-400">{when(item.v.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {[item.v.device, item.v.browser, item.v.city, item.v.durationMs ? `${Math.round(item.v.durationMs / 1000)}s on page` : null, item.v.referrerHost ? `from ${item.v.referrerHost}` : null, item.v.utmCampaign ? `campaign ${item.v.utmCampaign}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ) : (
                    <li key={item.e._id} className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-green-800">Clicked Apply{item.e.jobSlug ? ` · ${item.e.jobSlug}` : ""}</span>
                        <span className="shrink-0 text-[10px] text-green-700">{when(item.e.createdAt)}</span>
                      </div>
                      {item.e.targetHost && <p className="mt-0.5 text-[10px] text-green-700">to {item.e.targetHost}</p>}
                    </li>
                  )
                )}
              </ol>
              {timeline.length === 0 && <p className="text-center text-xs text-gray-400">No tracked activity yet</p>}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<MetricKey>("visitors");
  const [compare, setCompare] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [geoView, setGeoView] = useState<"countries" | "cities">("countries");
  const [techView, setTechView] = useState<"devices" | "browsers" | "operatingSystems">("devices");
  const [pageQuery, setPageQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [journeyEmail, setJourneyEmail] = useState<string | null>(null);

  const load = useCallback(async (days: number) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?range=${days}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Couldn't load analytics. Try refreshing.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/analytics?range=${range}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch(() => !cancelled && setError("Couldn't load analytics. Try refreshing."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load(range);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, range, load]);

  const pageRows = useMemo(
    () => (data?.pages ?? []).filter((p) => p.path.toLowerCase().includes(pageQuery.toLowerCase())).map((p) => ({ ...p, avgTimeSec: p.avgTimeSec ?? -1 })),
    [data, pageQuery]
  );
  const pageSort = useSorted(pageRows, "views");
  const jobRows = useMemo(() => (data?.jobs ?? []).map((j) => ({ ...j, ctr: j.ctr ?? -1 })), [data]);
  const jobSort = useSorted(jobRows, "views");
  const userRows = useMemo(
    () =>
      (data?.users ?? []).filter((u) => `${u.name} ${u.email} ${u.location}`.toLowerCase().includes(userQuery.toLowerCase())),
    [data, userQuery]
  );
  const userSort = useSorted(userRows, "visits");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
      </div>
    );
  }
  if (!data) return <p className="py-10 text-center text-sm text-red-600">{error || "No data"}</p>;

  const s = data.summary;
  const p = data.previous;
  const metricMeta = METRICS.find((m) => m.key === metric)!;
  const kpis: { label: string; value: string; delta: React.ReactNode; metric?: MetricKey; hint?: string }[] = [
    { label: "Visitors", value: fmt(s.visitors), delta: <Delta now={s.visitors} before={p.visitors} />, metric: "visitors" },
    { label: "Page views", value: fmt(s.pageviews), delta: <Delta now={s.pageviews} before={p.pageviews} />, metric: "pageviews" },
    { label: "Apply clicks", value: fmt(s.applyClicks), delta: <Delta now={s.applyClicks} before={p.applyClicks} />, metric: "applyClicks" },
    { label: "Signups", value: fmt(s.signups), delta: <Delta now={s.signups} before={p.signups} />, metric: "signups" },
    { label: "Sessions", value: s.sessions ? fmt(s.sessions) : "—", delta: <Delta now={s.sessions} before={p.sessions} />, hint: "Cookie-accepting visitors" },
    { label: "Pages / session", value: s.pagesPerSession?.toString() ?? "—", delta: <Delta now={s.pagesPerSession} before={p.pagesPerSession} /> },
    { label: "Bounce rate", value: s.bounceRate == null ? "—" : `${s.bounceRate}%`, delta: <Delta now={s.bounceRate} before={p.bounceRate} invert /> },
    { label: "Avg time on page", value: duration(s.avgTimeOnPageSec), delta: <Delta now={s.avgTimeOnPageSec} before={p.avgTimeOnPageSec} /> },
  ];
  const chartData = data.series.map((d) => ({ ...d, label: shortDate(d.date) }));
  const geoRows = geoView === "countries" ? data.countries : data.cities;
  const techRows = data[techView];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={String(range)}
            options={RANGES.map((r) => ({ value: String(r.days), label: r.label }))}
            onChange={(v) => {
              setLoading(true);
              setRange(Number(v));
            }}
          />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {data.liveNow} on site now
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="accent-green-600" />
            Auto-refresh
          </label>
          <span>Updated {new Date(data.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
          <button onClick={() => load(range)} className="rounded-lg border border-gray-200 px-2.5 py-1 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <details className="group rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <summary className="cursor-pointer list-none font-semibold">
          About this data <span className="font-normal text-amber-700">· real people only, bots and your visits excluded</span>
        </summary>
        <p className="mt-1.5 leading-relaxed">
        Sessions, traffic sources, campaigns, time on page and Apply clicks are collected from{" "}
        {data.enhancedSince ? when(data.enhancedSince) : "this release onward"}, for visitors who accept cookies. Earlier
        days only have page views, locations and devices. Bots and your own visits are excluded everywhere, and new views only count once the visitor taps, moves the mouse or presses a key, so a page load alone isn&apos;t counted. Apply clicks only count when a person clicked.
        </p>
      </details>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            disabled={!k.metric}
            onClick={() => k.metric && setMetric(k.metric)}
            title={k.hint}
            className={`rounded-2xl border bg-white p-3 text-left transition-colors sm:p-4 ${k.metric ? "cursor-pointer hover:border-gray-300" : "cursor-default"} ${k.metric === metric ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-100"}`}
          >
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 tabular-nums sm:mt-1 sm:text-2xl">{k.value}</p>
            <div className="mt-0.5 sm:mt-1">{k.delta}</div>
          </button>
        ))}
      </div>

      {/* Trend */}
      <Card
        title={`${metricMeta.label} over time`}
        actions={
          <div className="flex items-center gap-3">
            {metricMeta.prev && (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="accent-green-600" />
                Compare to previous {data.rangeDays === 1 ? "day" : `${data.rangeDays} days`}
              </label>
            )}
            <button onClick={() => downloadCsv(`reblet-daily-${data.rangeDays}d`, data.series)} className="text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer">
              Export CSV
            </button>
          </div>
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Area type="monotone" dataKey={metric} name={metricMeta.label} stroke="#16a34a" strokeWidth={2} fill="url(#metricFill)" />
              {compare && metricMeta.prev && (
                <Line type="monotone" dataKey={metricMeta.prev} name="Previous period" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Returning visitors */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="New vs returning visitors" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="newVisitors" name="New" stackId="v" fill="#86efac" radius={[0, 0, 0, 0]} />
                <Bar dataKey="returningVisitors" name="Returning" stackId="v" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Returning visitors">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data.returning.multiDayRate}%</p>
              <p className="text-[11px] text-gray-500">{fmt(data.returning.multiDay)} visitors came back on another day</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data.returning.returningRate}%</p>
              <p className="text-[11px] text-gray-500">first visited before this range</p>
            </div>
            <div className="col-span-2 rounded-xl bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{data.returning.avgLifetimeVisits}</p>
              <p className="text-[11px] text-gray-500">avg lifetime page views per visitor</p>
            </div>
          </div>
          <p className="mb-2 mt-4 text-xs font-medium text-gray-500">Lifetime page views per visitor</p>
          <BarList rows={data.returning.frequency.map((f) => ({ name: f.label, count: f.count }))} limit={6} />
        </Card>
      </div>

      {/* Retention + heatmap */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Weekly retention">
          <p className="mb-3 text-xs text-gray-400">Of visitors first seen in a week, the share who came back in each later week.</p>
          <Cohorts rows={data.cohorts} />
        </Card>
        <Card title={`When people visit (${data.timezone.replace("America/", "").replace("_", " ")} time)`}>
          <Heatmap rows={data.heatmap} />
        </Card>
      </div>

      {/* Jobs */}
      <Card
        title="Job performance"
        actions={
          <button onClick={() => downloadCsv(`reblet-jobs-${data.rangeDays}d`, data.jobs)} className="text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer">
            Export CSV
          </button>
        }
      >
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr>
                <Th label="Job" k="title" sort={jobSort} align="left" />
                <Th label="Views" k="views" sort={jobSort} />
                <Th label="Visitors" k="visitors" sort={jobSort} />
                <Th label="Apply clicks" k="applyClicks" sort={jobSort} />
                <Th label="Click-through" k="ctr" sort={jobSort} />
              </tr>
            </thead>
            <tbody>
              {jobSort.sorted.map((j) => (
                <tr key={j.slug} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="max-w-[280px] px-2 py-2">
                    <a href={`/jobs/${j.slug}`} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-gray-800 hover:text-green-700">
                      {j.title}
                    </a>
                    <span className="block truncate text-[11px] text-gray-400">{j.company}</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt(j.views)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt(j.visitors)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt(j.applyClicks)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{j.ctr < 0 ? "—" : `${j.ctr}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobSort.sorted.length === 0 && <p className="py-6 text-center text-xs text-gray-400">No job views in this range</p>}
        </div>
      </Card>

      {/* Acquisition */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Traffic sources">
          <BarList rows={data.sources} />
        </Card>
        <Card
          title="Campaigns (UTM)"
          actions={
            <button onClick={() => downloadCsv(`reblet-campaigns-${data.rangeDays}d`, data.campaigns)} className="text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer">
              Export CSV
            </button>
          }
        >
          <BarList rows={data.campaigns} />
          <p className="mt-3 text-[11px] text-gray-400">Add ?utm_source=linkedin&amp;utm_campaign=… to links you share to see them here.</p>
        </Card>
      </div>

      {/* Audience */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Where visitors are"
          actions={
            <Segmented
              value={geoView}
              options={[
                { value: "countries", label: "Countries" },
                { value: "cities", label: "Cities" },
              ]}
              onChange={setGeoView}
            />
          }
        >
          <BarList rows={geoRows} limit={10} />
        </Card>
        <Card
          title="Technology"
          actions={
            <Segmented
              value={techView}
              options={[
                { value: "devices", label: "Devices" },
                { value: "browsers", label: "Browsers" },
                { value: "operatingSystems", label: "OS" },
              ]}
              onChange={setTechView}
            />
          }
        >
          <BarList rows={techRows} limit={10} />
        </Card>
      </div>

      {/* Pages */}
      <Card
        title="Pages"
        actions={
          <div className="flex items-center gap-2">
            <input
              value={pageQuery}
              onChange={(e) => setPageQuery(e.target.value)}
              placeholder="Filter pages"
              className="w-40 rounded-lg border border-gray-200 px-2.5 py-1 text-xs focus:border-gray-400 focus:outline-none"
            />
            <button onClick={() => downloadCsv(`reblet-pages-${data.rangeDays}d`, data.pages)} className="text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer">
              Export CSV
            </button>
          </div>
        }
      >
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr>
                <Th label="Page" k="path" sort={pageSort} align="left" />
                <Th label="Views" k="views" sort={pageSort} />
                <Th label="Visitors" k="visitors" sort={pageSort} />
                <Th label="Avg time" k="avgTimeSec" sort={pageSort} />
              </tr>
            </thead>
            <tbody>
              {pageSort.sorted.map((pg) => (
                <tr key={pg.path} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="max-w-[320px] truncate px-2 py-1.5 font-medium text-gray-800">{pg.path}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(pg.views)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmt(pg.visitors)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pg.avgTimeSec < 0 ? "—" : duration(pg.avgTimeSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users */}
      <Card
        title={`Signed-up users (${data.users.length})`}
        actions={
          <div className="flex items-center gap-2">
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search name, email, city"
              className="w-48 rounded-lg border border-gray-200 px-2.5 py-1 text-xs focus:border-gray-400 focus:outline-none"
            />
            <button
              onClick={() => downloadCsv("reblet-users", data.users.map((u) => ({ name: u.name, email: u.email, signedUp: u.signedUp, region: u.region, location: u.location, visits: u.visits, visitsInRange: u.visitsInRange, sessions: u.sessions, daysActive: u.daysActive, firstSeen: u.firstSeen, lastSeen: u.lastSeen, topPage: u.topPage, device: u.device, timeOnSiteMin: u.timeOnSiteMin })))}
              className="text-xs font-medium text-green-700 hover:text-green-800 cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        }
      >
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr>
                <Th label="User" k="name" sort={userSort} align="left" />
                <Th label="Visits" k="visits" sort={userSort} />
                <Th label="In range" k="visitsInRange" sort={userSort} />
                <Th label="Days active" k="daysActive" sort={userSort} />
                <Th label="Last seen" k="lastSeen" sort={userSort} />
                <Th label="Signed up" k="signedUp" sort={userSort} />
                <Th label="Location" k="location" sort={userSort} align="left" />
              </tr>
            </thead>
            <tbody>
              {userSort.sorted.map((u) => (
                <tr key={u.email} onClick={() => setJourneyEmail(u.email)} className="cursor-pointer border-t border-gray-50 hover:bg-green-50/60">
                  <td className="max-w-[220px] px-2 py-2">
                    <span className="block truncate font-medium text-gray-800">{u.name || "—"}</span>
                    <span className="block truncate text-[11px] text-gray-400">{u.email}</span>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt(u.visits)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmt(u.visitsInRange)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{u.daysActive}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right text-gray-600">{when(u.lastSeen)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right text-gray-600">{when(u.signedUp)}</td>
                  <td className="max-w-[160px] truncate px-2 py-2 text-gray-600">{u.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">Click a user to see their full activity timeline.</p>
      </Card>

      {journeyEmail && <JourneyPanel email={journeyEmail} onClose={() => setJourneyEmail(null)} />}
    </div>
  );
}
