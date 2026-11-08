// Reads companies' public job boards (Greenhouse, Lever, Ashby, SmartRecruiters) and keeps
// early-career software roles in the US and Canada. These are the feeds the platforms publish
// for embedding careers pages, so no scraping of HTML is involved.

export type Ats = "greenhouse" | "lever" | "ashby" | "smartrecruiters";
export type FeedSource = { company: string; ats: Ats; token: string };

export type FeedJob = {
  key: string; // stable across runs: ats:token:id
  ats: Ats;
  token: string;
  company: string;
  title: string;
  location: string;
  applyUrl: string;
  description: string;
  salary: string;
  postedAt: string | null;
};

const TIMEOUT_MS = 15_000;
const UA = "RebletJobsBot/1.0 (+https://reblet.com)";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

export function htmlToText(html: string) {
  return html
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e: string) => ENTITIES[e])
    .replace(/<\s*(br|\/p|\/li|\/h\d|\/div)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e: string) => ENTITIES[e])
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

// ---- Filters ----

const EARLY_CAREER =
  /\b(intern(ship)?s?|co-?op|new[- ]grad(uate)?s?|university grad(uate)?|graduate (software|engineer|developer|program)|early[- ]career|entry[- ]level|junior|jr\.?|campus|student|apprentice(ship)?)\b/i;
const TOO_SENIOR = /\b(senior|sr\.?|staff|principal|manager|director|head of|vice president|vp|lead)\b/i;
// Software-side roles only; generic "engineer" alone would pull in electrical, civil and supplier roles.
const TECH =
  /\b(software|developer|swe|sde|programm(er|ing)|data (engineer(ing)?|scien(ce|tist))|analytics engineer|machine learning|ml|ai|artificial intelligence|deep learning|backend|back-end|frontend|front-end|full[- ]?stack|devops|sre|site reliability|platform|infrastructure|security|firmware|embedded|mobile|ios|android|cloud|quant(itative)? (developer|researcher|research|trader|trading)|research (engineer|scientist)|applied scientist|computer (science|vision)|web|compiler|test automation|qa|forward deployed|algorithm(s|ic)?)\b/i;
const NOT_TECH =
  /\b(sales|marketing|recruit(er|ing)|account(ant|ing)|finance|financial analyst|legal|counsel|people|hr|human resources|customer success|support specialist|business development|copywrit|content|communications|brand|event|office|facilities|paralegal|tax|audit|procurement)\b/i;

export function isEarlyCareerTech(title: string) {
  return EARLY_CAREER.test(title) && !TOO_SENIOR.test(title) && TECH.test(title) && !NOT_TECH.test(title);
}

const US_STATES =
  "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC";
const PROVINCES = "ON|BC|QC|AB|MB|NS|SK|NB|NL|PE";
const NORTH_AMERICA = new RegExp(
  [
    "\\b(united states|usa|u\\.s\\.a?|us|canada|canadian|americas|north america)\\b",
    "\\b(ontario|quebec|qu[ée]bec|british columbia|alberta|manitoba|nova scotia|saskatchewan|new brunswick)\\b",
    "\\b(toronto|waterloo|kitchener|vancouver|montr[ée]al|ottawa|calgary|edmonton|mississauga|markham|burnaby|victoria|halifax|winnipeg)\\b",
    "\\b(new york|nyc|san francisco|sf|bay area|seattle|boston|austin|chicago|los angeles|palo alto|mountain view|menlo park|sunnyvale|san jose|santa clara|redmond|bellevue|denver|boulder|atlanta|miami|pittsburgh|philadelphia|san diego|portland|dallas|houston|raleigh|salt lake|washington|arlington|cambridge|princeton|nashville|detroit|minneapolis|phoenix|irvine|berkeley|oakland|brooklyn|jersey city|columbus|madison)\\b",
    `(,|\\s|^)(${US_STATES}|${PROVINCES})(?=$|[\\s,;)])`,
  ].join("|"),
  "i"
);
const ELSEWHERE =
  /\b(uk|united kingdom|london|england|europe|emea|eu|germany|berlin|france|paris|ireland|dublin|poland|netherlands|amsterdam|spain|portugal|italy|sweden|switzerland|zurich|india|bangalore|bengaluru|hyderabad|pune|apac|asia|singapore|japan|tokyo|korea|china|hong kong|taiwan|australia|sydney|brazil|mexico|latam|argentina|colombia|israel|tel aviv|uae|dubai)\b/i;

export function inUsOrCanada(location: string) {
  if (!location.trim()) return false;
  if (NORTH_AMERICA.test(location)) return true;
  // A bare "Remote" counts; "Belgrade (Remote)" names somewhere else.
  const rest = location.replace(/\b(remote|hybrid|anywhere|work from home|wfh)\b|[()\-–,;|•/]/gi, "").trim();
  return /\bremote\b/i.test(location) && !rest && !ELSEWHERE.test(location);
}

// ---- Feed readers ----

type GreenhouseJob = { id: number; title: string; location?: { name?: string }; absolute_url: string; content?: string; updated_at?: string; first_published?: string };
type LeverJob = {
  id: string;
  text: string;
  categories?: { location?: string; allLocations?: string[] };
  hostedUrl: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  lists?: { text: string; content: string }[];
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
  createdAt?: number;
};
type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  secondaryLocations?: { location?: string }[];
  isRemote?: boolean;
  jobUrl: string;
  applyUrl?: string;
  descriptionPlain?: string;
  publishedAt?: string;
  isListed?: boolean;
  compensation?: { compensationTierSummary?: string };
};
type SmartJob = {
  id: string;
  name: string;
  location?: { city?: string; region?: string; country?: string; remote?: boolean; fullLocation?: string };
  releasedDate?: string;
};

function money(n?: number) {
  return n == null ? "" : `$${n.toLocaleString("en-US")}`;
}

async function readGreenhouse(src: FeedSource): Promise<FeedJob[]> {
  const data = (await getJson(`https://boards-api.greenhouse.io/v1/boards/${src.token}/jobs?content=true`)) as { jobs?: GreenhouseJob[] };
  return (data.jobs ?? []).map((j) => ({
    key: `greenhouse:${src.token}:${j.id}`,
    ats: "greenhouse",
    token: src.token,
    company: src.company,
    title: j.title.trim(),
    location: j.location?.name?.trim() ?? "",
    applyUrl: j.absolute_url,
    description: htmlToText(j.content ?? ""),
    salary: "",
    postedAt: j.first_published ?? j.updated_at ?? null,
  }));
}

async function readLever(src: FeedSource): Promise<FeedJob[]> {
  const data = (await getJson(`https://api.lever.co/v0/postings/${src.token}?mode=json`)) as LeverJob[];
  return (Array.isArray(data) ? data : []).map((j) => {
    const lists = (j.lists ?? []).map((l) => `${l.text}\n${htmlToText(l.content)}`).join("\n\n");
    const range = j.salaryRange;
    const salary =
      range?.min && range?.max ? `${money(range.min)}–${money(range.max)} ${range.currency ?? ""}${range.interval ? ` ${range.interval.replace("-", " ")}` : ""}`.trim() : "";
    return {
      key: `lever:${src.token}:${j.id}`,
      ats: "lever" as const,
      token: src.token,
      company: src.company,
      title: j.text.trim(),
      location: (j.categories?.allLocations?.length ? j.categories.allLocations.join("; ") : j.categories?.location ?? "").trim(),
      applyUrl: j.hostedUrl,
      description: [j.descriptionPlain, lists, j.additionalPlain].filter(Boolean).join("\n\n").trim(),
      salary,
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    };
  });
}

async function readAshby(src: FeedSource): Promise<FeedJob[]> {
  const data = (await getJson(`https://api.ashbyhq.com/posting-api/job-board/${src.token}?includeCompensation=true`)) as { jobs?: AshbyJob[] };
  return (data.jobs ?? [])
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      key: `ashby:${src.token}:${j.id}`,
      ats: "ashby" as const,
      token: src.token,
      company: src.company,
      title: j.title.trim(),
      location: [j.location, ...(j.secondaryLocations ?? []).map((l) => l.location)].filter(Boolean).join("; ") + (j.isRemote && !/remote/i.test(j.location ?? "") ? " (Remote)" : ""),
      applyUrl: j.jobUrl,
      description: (j.descriptionPlain ?? "").trim(),
      salary: j.compensation?.compensationTierSummary ?? "",
      postedAt: j.publishedAt ?? null,
    }));
}

async function readSmartRecruiters(src: FeedSource): Promise<FeedJob[]> {
  const jobs: SmartJob[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const page = (await getJson(`https://api.smartrecruiters.com/v1/companies/${src.token}/postings?limit=100&offset=${offset}`)) as {
      content?: SmartJob[];
      totalFound?: number;
    };
    jobs.push(...(page.content ?? []));
    if (!page.content?.length || jobs.length >= (page.totalFound ?? 0)) break;
  }
  return jobs.map((j) => ({
    key: `smartrecruiters:${src.token}:${j.id}`,
    ats: "smartrecruiters" as const,
    token: src.token,
    company: src.company,
    title: j.name.trim(),
    location:
      j.location?.fullLocation ??
      ([j.location?.city, j.location?.region, j.location?.country?.toUpperCase()].filter(Boolean).join(", ") + (j.location?.remote ? " (Remote)" : "")),
    applyUrl: `https://jobs.smartrecruiters.com/${src.token}/${j.id}`,
    description: "",
    salary: "",
    postedAt: j.releasedDate ?? null,
  }));
}

// SmartRecruiters lists postings without descriptions; this fetches one when a role is kept.
export async function smartRecruitersDescription(token: string, id: string) {
  const data = (await getJson(`https://api.smartrecruiters.com/v1/companies/${token}/postings/${id}`)) as {
    jobAd?: { sections?: Record<string, { title?: string; text?: string }> };
  };
  return Object.values(data.jobAd?.sections ?? {})
    .map((s) => [s.title, htmlToText(s.text ?? "")].filter(Boolean).join("\n"))
    .join("\n\n")
    .trim();
}

const READERS: Record<Ats, (src: FeedSource) => Promise<FeedJob[]>> = {
  greenhouse: readGreenhouse,
  lever: readLever,
  ashby: readAshby,
  smartrecruiters: readSmartRecruiters,
};

export function readFeed(src: FeedSource) {
  return READERS[src.ats](src);
}

export type CrawlResult = {
  scanned: number;
  matches: FeedJob[];
  failures: { company: string; error: string }[];
};

// Reads every source a few at a time and returns the early-career US/Canada software roles.
export async function crawlFeeds(sources: FeedSource[], concurrency = 8): Promise<CrawlResult> {
  const result: CrawlResult = { scanned: 0, matches: [], failures: [] };
  const queue = [...sources];
  async function worker() {
    for (let src = queue.shift(); src; src = queue.shift()) {
      try {
        const jobs = await readFeed(src);
        result.scanned += jobs.length;
        for (const job of jobs) {
          if (isEarlyCareerTech(job.title) && inUsOrCanada(job.location)) result.matches.push(job);
        }
      } catch (err) {
        result.failures.push({ company: src.company, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker));
  result.matches = mergeCities(result.matches);
  return result;
}

// Many companies post one opening per city; review them as one role with every location listed.
function mergeCities(jobs: FeedJob[]) {
  const byRole = new Map<string, FeedJob>();
  for (const job of jobs) {
    const id = `${job.company}|${job.title}`.toLowerCase().replace(/\s+/g, " ");
    const seen = byRole.get(id);
    if (!seen) byRole.set(id, { ...job });
    else {
      const places = new Set([...seen.location.split("; "), ...job.location.split("; ")].filter(Boolean));
      seen.location = [...places].join("; ");
    }
  }
  return [...byRole.values()];
}
