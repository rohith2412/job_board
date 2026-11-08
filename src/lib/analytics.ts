import { connectDB } from "@/lib/mongodb";
import { BOT_PATTERNS, parseUserAgent } from "@/lib/user-agent";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { SavedJob } from "@/models/SavedJob";
import { User } from "@/models/User";
import { Visit } from "@/models/Visit";

const ADMIN_EMAIL = "rohithra75@gmail.com";
// The site owner's accounts; their visits are not real traffic.
const OWNER_EMAILS = [ADMIN_EMAIL, "rohithdevswe@gmail.com"];
export const ANALYTICS_TZ = "America/Toronto";
const DAY_MS = 24 * 60 * 60 * 1000;
// Before richer tracking shipped, the owner's own visits were only identifiable by location.
const LEGACY_CUTOFF = new Date("2026-11-07T11:00:00Z");
const LISTING_PAGES = new Set(["internships", "new-grad", "remote", "in"]);

// Real traffic only: no owner devices, no owner account, and the legacy owner-location rule for old data.
// Bots are re-checked here because older visits were stored before the bot filter caught them all.
// Newer visits also need proof of a person (a tap, mouse movement or key press); human is false until then.
export const REAL_VISITS = {
  internal: { $ne: true },
  human: { $ne: false },
  userEmail: { $nin: OWNER_EMAILS },
  userAgent: { $not: BOT_PATTERNS },
  $nor: [{ createdAt: { $lt: LEGACY_CUTOFF }, city: /Sudbury/i, country: "CA" }],
};
const REAL_EVENTS = { internal: { $ne: true }, human: { $ne: false }, userEmail: { $nin: OWNER_EMAILS } };

type VisitRow = {
  path: string;
  country?: string;
  city?: string;
  ip?: string;
  userAgent?: string;
  userEmail?: string;
  userName?: string;
  visitorId?: string;
  sessionId?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
  browser?: string;
  os?: string;
  durationMs?: number;
  createdAt: Date;
};

// The best available identity: cookie visitor ID, then account, then IP for older or non-consenting visits.
const identityOf = (v: { visitorId?: string; userEmail?: string; ip?: string }) =>
  v.visitorId || v.userEmail || v.ip || "unknown";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFmt = new Intl.DateTimeFormat("en-US", { timeZone: ANALYTICS_TZ, weekday: "short", hour: "numeric", hourCycle: "h23" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayKey = (d: Date) => dayFmt.format(d);

function weekKey(d: Date) {
  const [y, m, day] = dayKey(d).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function countryName(code?: string) {
  if (!code) return "Unknown";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function sourceLabel(v: VisitRow) {
  if (v.utmSource) return v.utmSource.charAt(0).toUpperCase() + v.utmSource.slice(1);
  const host = v.referrerHost ?? "";
  if (!host) return "Direct";
  if (/linkedin\.com|lnkd\.in/.test(host)) return "LinkedIn";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (/bing\.com/.test(host)) return "Bing";
  if (/duckduckgo\.com/.test(host)) return "DuckDuckGo";
  if (/(^|\.)t\.co$|twitter\.com|x\.com/.test(host)) return "X (Twitter)";
  if (/reddit\.com/.test(host)) return "Reddit";
  if (/facebook\.com|fb\.com|instagram\.com/.test(host)) return "Meta";
  if (/chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai/.test(host)) return "AI assistants";
  return host;
}

function tally<T>(rows: T[], key: (r: T) => string | undefined) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function summarize(visits: VisitRow[], applyClicks: number, signups: number) {
  const visitors = new Set(visits.map(identityOf));
  const sessions = new Map<string, number>();
  for (const v of visits) if (v.sessionId) sessions.set(v.sessionId, (sessions.get(v.sessionId) ?? 0) + 1);
  const durations = visits.map((v) => v.durationMs).filter((d): d is number => typeof d === "number");
  const bounced = [...sessions.values()].filter((n) => n === 1).length;
  return {
    pageviews: visits.length,
    visitors: visitors.size,
    sessions: sessions.size,
    pagesPerSession: sessions.size ? +(visits.filter((v) => v.sessionId).length / sessions.size).toFixed(2) : null,
    bounceRate: sessions.size ? Math.round((bounced / sessions.size) * 100) : null,
    avgTimeOnPageSec: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : null,
    signedInUsers: new Set(visits.map((v) => v.userEmail).filter(Boolean)).size,
    applyClicks,
    signups,
  };
}

export async function buildAnalytics(rangeDays: number) {
  await connectDB();
  const now = new Date();
  const start = new Date(now.getTime() - rangeDays * DAY_MS);
  const prevStart = new Date(start.getTime() - rangeDays * DAY_MS);
  const cohortStart = new Date(now.getTime() - 8 * 7 * DAY_MS);
  const fetchFrom = prevStart < cohortStart ? prevStart : cohortStart;

  const [visits, firstSeenRows, events, signupDocs, users, enhancedFirst] = await Promise.all([
    Visit.find({ ...REAL_VISITS, createdAt: { $gte: fetchFrom } })
      .select("path country city ip userAgent userEmail userName visitorId sessionId referrerHost utmSource utmMedium utmCampaign device browser os durationMs createdAt")
      .lean() as Promise<VisitRow[]>,
    Visit.aggregate<{ _id: string; first: Date; visits: number }>([
      { $match: REAL_VISITS },
      { $group: { _id: { $ifNull: ["$visitorId", "$userEmail", "$ip", "unknown"] }, first: { $min: "$createdAt" }, visits: { $sum: 1 } } },
    ]),
    AnalyticsEvent.find({ ...REAL_EVENTS, createdAt: { $gte: prevStart } }).select("type jobSlug targetHost createdAt").lean(),
    User.find({ email: { $nin: OWNER_EMAILS }, createdAt: { $gte: prevStart } }).select("createdAt").lean(),
    User.find({ email: { $nin: OWNER_EMAILS } }).select("email name image region createdAt lastLoginCity lastLoginCountry").lean(),
    Visit.findOne({ ...REAL_VISITS, device: { $exists: true } }).sort({ createdAt: 1 }).select("createdAt").lean(),
  ]);

  // Older visits predate stored device fields; derive them from the user agent so the breakdowns cover all data.
  for (const v of visits) {
    if (!v.device && v.userAgent) Object.assign(v, parseUserAgent(v.userAgent));
  }

  const firstSeen = new Map(firstSeenRows.map((r) => [r._id, r.first]));
  const lifetimeVisits = new Map(firstSeenRows.map((r) => [r._id, r.visits]));
  const inRange = (d: Date, from: Date, to: Date) => d >= from && d < to;
  const current = visits.filter((v) => inRange(v.createdAt, start, now));
  const previous = visits.filter((v) => inRange(v.createdAt, prevStart, start));
  const curEvents = events.filter((e) => inRange(e.createdAt, start, now));
  const prevEvents = events.filter((e) => inRange(e.createdAt, prevStart, start));
  const count = <T extends { createdAt: Date }>(rows: T[], from: Date, to: Date) => rows.filter((r) => inRange(r.createdAt, from, to)).length;

  // Daily series with new vs returning visitors.
  const days: string[] = [];
  for (let t = start.getTime(); t <= now.getTime() + DAY_MS; t += DAY_MS) {
    const k = dayKey(new Date(t));
    if (!days.includes(k) && k <= dayKey(now)) days.push(k);
  }
  const byDay = new Map(days.map((d) => [d, { date: d, pageviews: 0, visitors: new Set<string>(), newVisitors: new Set<string>(), applyClicks: 0, signups: 0 }]));
  for (const v of current) {
    const b = byDay.get(dayKey(v.createdAt));
    if (!b) continue;
    const id = identityOf(v);
    b.pageviews++;
    b.visitors.add(id);
    const first = firstSeen.get(id);
    if (first && dayKey(first) === b.date) b.newVisitors.add(id);
  }
  for (const e of curEvents) {
    const b = byDay.get(dayKey(e.createdAt));
    if (b && e.type === "apply_click") b.applyClicks++;
  }
  for (const u of signupDocs) {
    const b = byDay.get(dayKey(u.createdAt));
    if (b && inRange(u.createdAt, start, now)) b.signups++;
  }
  const prevByDay = new Map<string, { pageviews: number; visitors: Set<string> }>();
  for (const v of previous) {
    const shifted = dayKey(new Date(v.createdAt.getTime() + rangeDays * DAY_MS));
    const b = prevByDay.get(shifted) ?? { pageviews: 0, visitors: new Set<string>() };
    b.pageviews++;
    b.visitors.add(identityOf(v));
    prevByDay.set(shifted, b);
  }
  const series = [...byDay.values()].map((b) => ({
    date: b.date,
    pageviews: b.pageviews,
    visitors: b.visitors.size,
    newVisitors: b.newVisitors.size,
    returningVisitors: b.visitors.size - b.newVisitors.size,
    applyClicks: b.applyClicks,
    signups: b.signups,
    prevPageviews: prevByDay.get(b.date)?.pageviews ?? 0,
    prevVisitors: prevByDay.get(b.date)?.visitors.size ?? 0,
  }));

  // Pages and jobs.
  const pageStats = new Map<string, { views: number; visitors: Set<string>; durations: number[] }>();
  for (const v of current) {
    const s = pageStats.get(v.path) ?? { views: 0, visitors: new Set<string>(), durations: [] };
    s.views++;
    s.visitors.add(identityOf(v));
    if (typeof v.durationMs === "number") s.durations.push(v.durationMs);
    pageStats.set(v.path, s);
  }
  const pages = [...pageStats.entries()]
    .map(([path, s]) => ({
      path,
      views: s.views,
      visitors: s.visitors.size,
      avgTimeSec: s.durations.length ? Math.round(s.durations.reduce((a, b) => a + b, 0) / s.durations.length / 1000) : null,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 100);

  const jobViews = new Map<string, { views: number; visitors: Set<string> }>();
  for (const v of current) {
    const slug = v.path.match(/^\/jobs\/([^/?#]+)$/)?.[1];
    if (!slug || LISTING_PAGES.has(slug)) continue;
    const s = jobViews.get(slug) ?? { views: 0, visitors: new Set<string>() };
    s.views++;
    s.visitors.add(identityOf(v));
    jobViews.set(slug, s);
  }
  const applyBySlug = tally(curEvents.filter((e) => e.type === "apply_click"), (e) => e.jobSlug ?? undefined);
  const applyMap = new Map(applyBySlug.map((a) => [a.name, a.count]));
  const jobSlugs = [...new Set([...jobViews.keys(), ...applyMap.keys()])];
  const jobDocs = await SavedJob.find({ slug: { $in: jobSlugs } }).select("slug title company").lean();
  const jobInfo = new Map(jobDocs.map((j) => [j.slug as string, j as { title: string; company: string }]));
  const jobs = jobSlugs
    .map((slug) => {
      const views = jobViews.get(slug)?.views ?? 0;
      const clicks = applyMap.get(slug) ?? 0;
      return {
        slug,
        title: jobInfo.get(slug)?.title ?? slug,
        company: jobInfo.get(slug)?.company ?? "",
        views,
        visitors: jobViews.get(slug)?.visitors.size ?? 0,
        applyClicks: clicks,
        ctr: views ? Math.round((clicks / views) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => b.views - a.views || b.applyClicks - a.applyClicks)
    .slice(0, 100);

  // Acquisition: one landing per session (or per visitor-day when there is no session).
  const landings = new Map<string, VisitRow>();
  for (const v of [...current].sort((a, b) => +a.createdAt - +b.createdAt)) {
    if (v.createdAt < LEGACY_CUTOFF) continue;
    const key = v.sessionId ?? `${identityOf(v)}|${dayKey(v.createdAt)}`;
    if (!landings.has(key)) landings.set(key, v);
  }
  const landingRows = [...landings.values()];
  const sources = tally(landingRows, sourceLabel);
  const campaigns = tally(
    current.filter((v) => v.utmCampaign),
    (v) => `${v.utmCampaign}${v.utmSource ? ` · ${v.utmSource}` : ""}${v.utmMedium ? ` / ${v.utmMedium}` : ""}`
  );

  // Audience.
  const visitorsBy = (key: (v: VisitRow) => string | undefined) => {
    const map = new Map<string, Set<string>>();
    for (const v of current) {
      const k = key(v);
      if (!k) continue;
      const set = map.get(k) ?? new Set<string>();
      set.add(identityOf(v));
      map.set(k, set);
    }
    return [...map.entries()].map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count);
  };
  const countries = visitorsBy((v) => countryName(v.country)).slice(0, 50);
  const cities = visitorsBy((v) => (v.city ? `${v.city}, ${countryName(v.country)}` : undefined)).slice(0, 50);
  const devices = visitorsBy((v) => v.device);
  const browsers = visitorsBy((v) => v.browser);
  const operatingSystems = visitorsBy((v) => v.os);

  // When people visit, in Eastern time.
  const heatmap = WEEKDAYS.map((day) => ({ day, hours: Array.from({ length: 24 }, () => 0) }));
  for (const v of current) {
    const parts = partsFmt.formatToParts(v.createdAt);
    const wd = WEEKDAYS.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "");
    const hr = Number(parts.find((p) => p.type === "hour")?.value);
    if (wd >= 0 && hr >= 0 && hr < 24) heatmap[wd].hours[hr]++;
  }

  // Weekly retention: of visitors first seen in a week, the share active in each following week.
  const activeWeeks = new Map<string, Set<string>>();
  for (const v of visits) {
    if (v.createdAt < cohortStart) continue;
    const id = identityOf(v);
    const set = activeWeeks.get(id) ?? new Set<string>();
    set.add(weekKey(v.createdAt));
    activeWeeks.set(id, set);
  }
  const cohortMap = new Map<string, string[]>();
  for (const [id, first] of firstSeen) {
    if (first < cohortStart) continue;
    const wk = weekKey(first);
    cohortMap.set(wk, [...(cohortMap.get(wk) ?? []), id]);
  }
  const weekKeys = [...new Set([...cohortMap.keys()])].sort();
  const allWeeks: string[] = [];
  for (let t = cohortStart.getTime(); t <= now.getTime(); t += 7 * DAY_MS) {
    const k = weekKey(new Date(t));
    if (!allWeeks.includes(k)) allWeeks.push(k);
  }
  const cohorts = weekKeys.map((wk) => {
    const ids = cohortMap.get(wk) ?? [];
    const idx = allWeeks.indexOf(wk);
    const later = allWeeks.slice(idx);
    return {
      week: wk,
      size: ids.length,
      retention: later.map((w) => Math.round((ids.filter((id) => activeWeeks.get(id)?.has(w)).length / Math.max(ids.length, 1)) * 100)),
    };
  });

  // Returning-visitor profile for the selected range.
  const rangeIds = [...new Set(current.map(identityOf))];
  const returningIds = rangeIds.filter((id) => (firstSeen.get(id) ?? now) < start);
  const daysInRange = new Map<string, Set<string>>();
  for (const v of current) {
    const id = identityOf(v);
    const set = daysInRange.get(id) ?? new Set<string>();
    set.add(dayKey(v.createdAt));
    daysInRange.set(id, set);
  }
  const multiDayIds = rangeIds.filter((id) => (daysInRange.get(id)?.size ?? 0) >= 2);
  const buckets = [
    { label: "1 visit", min: 1, max: 1 },
    { label: "2 visits", min: 2, max: 2 },
    { label: "3–5", min: 3, max: 5 },
    { label: "6–10", min: 6, max: 10 },
    { label: "11–25", min: 11, max: 25 },
    { label: "26+", min: 26, max: Infinity },
  ].map((b) => ({ label: b.label, count: rangeIds.filter((id) => {
    const n = lifetimeVisits.get(id) ?? 0;
    return n >= b.min && n <= b.max;
  }).length }));

  // Signed-in users, joined with their account details.
  const userAgg = await Visit.aggregate<{
    _id: string;
    visits: number;
    sessions: string[];
    days: string[];
    first: Date;
    last: Date;
    paths: string[];
    country: string;
    city: string;
    userAgent: string;
    durationMs: number;
  }>([
    { $match: { ...REAL_VISITS, userEmail: { $nin: [null, "", ...OWNER_EMAILS] } } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$userEmail",
        visits: { $sum: 1 },
        sessions: { $addToSet: "$sessionId" },
        days: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: ANALYTICS_TZ } } },
        first: { $first: "$createdAt" },
        last: { $last: "$createdAt" },
        paths: { $push: "$path" },
        country: { $last: "$country" },
        city: { $last: "$city" },
        userAgent: { $last: "$userAgent" },
        durationMs: { $sum: { $ifNull: ["$durationMs", 0] } },
      },
    },
  ]);
  const usage = new Map(userAgg.map((u) => [u._id, u]));
  const userRows = users.map((u) => {
    const a = usage.get(u.email as string);
    const topPage = a ? tally(a.paths, (p) => p)[0]?.name ?? null : null;
    const visitsInRange = current.filter((v) => v.userEmail === u.email).length;
    return {
      email: u.email as string,
      name: (u.name as string) || "",
      image: (u.image as string) || "",
      signedUp: u.createdAt as Date,
      region: (u.region as string) || "",
      visits: a?.visits ?? 0,
      visitsInRange,
      sessions: a ? a.sessions.filter(Boolean).length : 0,
      daysActive: a?.days.length ?? 0,
      firstSeen: a?.first ?? null,
      lastSeen: a?.last ?? null,
      topPage,
      location: a?.city ? `${a.city}, ${countryName(a.country)}` : a?.country ? countryName(a.country) : (u.lastLoginCity as string) || "",
      device: a?.userAgent ? parseUserAgent(a.userAgent).device : null,
      timeOnSiteMin: a ? Math.round(a.durationMs / 60000) : 0,
    };
  }).sort((a, b) => b.visits - a.visits);

  const live = new Set(visits.filter((v) => now.getTime() - v.createdAt.getTime() < 5 * 60 * 1000).map(identityOf)).size;

  return {
    generatedAt: now,
    rangeDays,
    timezone: ANALYTICS_TZ,
    enhancedSince: enhancedFirst?.createdAt ?? null,
    liveNow: live,
    summary: summarize(current, curEvents.length, count(signupDocs, start, now)),
    previous: summarize(previous, prevEvents.length, count(signupDocs, prevStart, start)),
    returning: {
      visitors: rangeIds.length,
      returning: returningIds.length,
      newVisitors: rangeIds.length - returningIds.length,
      returningRate: rangeIds.length ? Math.round((returningIds.length / rangeIds.length) * 100) : 0,
      multiDay: multiDayIds.length,
      multiDayRate: rangeIds.length ? Math.round((multiDayIds.length / rangeIds.length) * 100) : 0,
      avgLifetimeVisits: rangeIds.length
        ? +(rangeIds.reduce((s, id) => s + (lifetimeVisits.get(id) ?? 0), 0) / rangeIds.length).toFixed(1)
        : 0,
      frequency: buckets,
    },
    series,
    pages,
    jobs,
    sources,
    campaigns,
    countries,
    cities,
    devices,
    browsers,
    operatingSystems,
    heatmap,
    cohorts,
    users: userRows,
  };
}

export async function buildUserJourney(email: string) {
  await connectDB();
  const [user, visits, events] = await Promise.all([
    User.findOne({ email }).select("email name image region createdAt lastLoginCity lastLoginCountry emailConsent").lean(),
    Visit.find({ ...REAL_VISITS, userEmail: email })
      .sort({ createdAt: -1 })
      .limit(300)
      .select("path createdAt durationMs city country referrerHost utmSource utmCampaign userAgent sessionId")
      .lean(),
    AnalyticsEvent.find({ ...REAL_EVENTS, userEmail: email }).sort({ createdAt: -1 }).limit(100).select("type jobSlug targetHost createdAt").lean(),
  ]);
  return {
    user,
    visits: visits.map((v) => ({ ...v, ...parseUserAgent((v.userAgent as string) || "") , userAgent: undefined })),
    events,
  };
}
