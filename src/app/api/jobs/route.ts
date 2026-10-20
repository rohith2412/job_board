import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CachedSearch } from "@/models/CachedSearch";
import { SavedJob } from "@/models/SavedJob";

interface Job {
  title: string;
  company: string;
  location: string;
  snippet: string;
  link: string;
  salary: string;
  source: string;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const SWE_KEYWORDS = [
  "software", "engineer", "developer", "frontend", "backend", "fullstack",
  "full-stack", "full stack", "react", "node", "python", "java", "typescript",
  "javascript", "golang", "rust", "devops", "sre", "cloud", "aws", "azure",
  "mobile", "ios", "android", "flutter", "web developer", "programmer",
  "coding", "api", "microservices", "machine learning", "ml engineer",
  "data engineer", "platform engineer", "infrastructure", "kubernetes",
  "docker", "ci/cd", "database", "sql", "nosql", "mongodb", "postgresql",
  "vue", "angular", "next.js", "django", "flask", "spring", "rails",
  "ruby", "php", "laravel", "swift", "kotlin", ".net", "c#", "c++",
];

function filterByLocation(jobs: Job[], location: string): Job[] {
  const loc = location.toLowerCase().trim();
  if (!loc) return jobs;
  return jobs.filter((job) => {
    const jobLoc = job.location.toLowerCase().trim();
    if (!jobLoc) return false;
    if (jobLoc.includes("remote") || jobLoc === "anywhere" || jobLoc === "worldwide") return true;
    return jobLoc.includes(loc) || loc.includes(jobLoc);
  });
}

function isSWEJob(job: Job): boolean {
  const text = `${job.title} ${job.snippet}`.toLowerCase();
  return SWE_KEYWORDS.some((kw) => text.includes(kw));
}

// ---------- Jooble ----------
// async function fetchJooble(keywords: string, location: string): Promise<Job[]> {
//   const apiKey = process.env.JOOBLE_API_KEY;
//   if (!apiKey) return [];
//   try {
//     const pages = [1, 2, 3];
//     const results = await Promise.all(
//       pages.map((page) =>
//         fetch(`https://ca.jooble.org/api/${apiKey}`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ keywords, location, page }),
//           cache: "no-store",
//         }).then((r) => (r.ok ? r.json() : { jobs: [] }))
//           .catch(() => ({ jobs: [] }))
//       )
//     );
//     return results.flatMap((data) =>
//       (data.jobs || []).map((job: Record<string, string>) => ({
//         title: job.title || "",
//         company: job.company || "",
//         location: job.location || "",
//         snippet: job.snippet || "",
//         link: job.link || "",
//         salary: job.salary || "",
//         source: "Jooble",
//       }))
//     );
//   } catch {
//     return [];
//   }
// }

// ---------- USAJOBS ----------
// async function fetchUSAJobs(keywords: string, location: string): Promise<Job[]> {
//   const apiKey = process.env.USAJOBS_API_KEY;
//   const email = process.env.USAJOBS_EMAIL;
//   if (!apiKey || !email) return [];
//   try {
//     const searches = [
//       { Keyword: keywords || "software engineer", LocationName: location, ResultsPerPage: "50" },
//       { Keyword: "software developer", LocationName: location, ResultsPerPage: "50" },
//       { Keyword: "IT specialist", LocationName: location, ResultsPerPage: "50" },
//     ];
//     const results = await Promise.all(
//       searches.map((s) => {
//         const params = new URLSearchParams(s);
//         return fetch(`https://data.usajobs.gov/api/search?${params}`, {
//           headers: { "Authorization-Key": apiKey, "User-Agent": email },
//           cache: "no-store",
//         }).then((r) => (r.ok ? r.json() : { SearchResult: { SearchResultItems: [] } }))
//           .catch(() => ({ SearchResult: { SearchResultItems: [] } }));
//       })
//     );
//     const seen = new Set<string>();
//     return results.flatMap((data) =>
//       (data.SearchResult?.SearchResultItems || [])
//         .map((item: Record<string, Record<string, string>>) => {
//           const pos = item.MatchedObjectDescriptor;
//           const remuneration = pos.PositionRemuneration as unknown as
//             | Array<{ MinimumRange: string; MaximumRange: string }>
//             | undefined;
//           return {
//             title: pos.PositionTitle || "",
//             company: pos.OrganizationName || "",
//             location: pos.PositionLocationDisplay || "",
//             snippet: (pos.QualificationSummary || "").slice(0, 300),
//             link: pos.PositionURI || "",
//             salary: remuneration?.[0]
//               ? `$${remuneration[0].MinimumRange} - $${remuneration[0].MaximumRange}`
//               : "",
//             source: "USAJOBS",
//           };
//         })
//         .filter((j: Job) => {
//           if (seen.has(j.link)) return false;
//           seen.add(j.link);
//           return true;
//         })
//     );
//   } catch {
//     return [];
//   }
// }

// ---------- Himalayas ----------
async function fetchHimalayas(keywords: string): Promise<Job[]> {
  try {
    const offsets = Array.from({ length: 50 }, (_, i) => i * 20);
    const pages = await Promise.all(
      offsets.map((offset) =>
        fetch(`https://himalayas.app/jobs/api?limit=20&offset=${offset}`, {
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : { jobs: [] }))
          .catch(() => ({ jobs: [] }))
      )
    );
    const allJobs: Job[] = pages.flatMap((p) =>
      (p.jobs || []).map((job: Record<string, string | string[] | number>) => ({
        title: (job.title as string) || "",
        company: (job.companyName as string) || "",
        location: Array.isArray(job.locationRestrictions)
          ? job.locationRestrictions.join(", ")
          : (job.locationRestrictions as string) || "Remote",
        snippet: typeof job.excerpt === "string" ? job.excerpt : "",
        link: (job.applicationLink as string) || "",
        salary:
          job.minSalary && job.maxSalary
            ? `$${job.minSalary} - $${job.maxSalary}`
            : "",
        source: "Himalayas",
      }))
    );
    const kw = (keywords || "software engineer").toLowerCase().split(/\s+/);
    return allJobs.filter((job) => {
      const text = `${job.title} ${job.company} ${job.snippet}`.toLowerCase();
      return kw.some((k) => text.includes(k));
    });
  } catch {
    return [];
  }
}

// ---------- Remotive (free, no key, software-dev category) ----------
async function fetchRemotive(keywords: string): Promise<Job[]> {
  try {
    const categories = ["software-dev", "devops", "data", "cyber-security"];
    const results = await Promise.all(
      categories.map((cat) =>
        fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=50`, {
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : { jobs: [] }))
          .catch(() => ({ jobs: [] }))
      )
    );
    const allJobs: Job[] = results.flatMap((data) =>
      (data.jobs || []).map((job: Record<string, string | number>) => ({
        title: (job.title as string) || "",
        company: (job.company_name as string) || "",
        location: (job.candidate_required_location as string) || "Remote",
        snippet: ((job.description as string) || "").replace(/<[^>]*>/g, "").slice(0, 300),
        link: (job.url as string) || "",
        salary: job.salary ? String(job.salary) : "",
        source: "Remotive",
      }))
    );
    if (!keywords) return allJobs;
    const kw = keywords.toLowerCase().split(/\s+/);
    return allJobs.filter((job) => {
      const text = `${job.title} ${job.company} ${job.snippet}`.toLowerCase();
      return kw.some((k) => text.includes(k));
    });
  } catch {
    return [];
  }
}

// ---------- RemoteOK (free, no key) ----------
async function fetchRemoteOK(): Promise<Job[]> {
  try {
    const tags = ["dev", "engineer", "javascript", "python", "react", "backend", "frontend", "golang", "devops"];
    const results = await Promise.all(
      tags.map((tag) =>
        fetch(`https://remoteok.com/api?tag=${tag}`, {
          headers: { "User-Agent": "JobBoard/1.0" },
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    );
    const seen = new Set<string>();
    return results.flatMap((data) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((job: Record<string, string>) => job.id && job.position)
        .map((job: Record<string, string | string[]>) => ({
          title: (job.position as string) || "",
          company: (job.company as string) || "",
          location: Array.isArray(job.location)
            ? job.location.join(", ")
            : (job.location as string) || "Remote",
          snippet: ((job.description as string) || "").replace(/<[^>]*>/g, "").slice(0, 300),
          link: (job.url as string) || `https://remoteok.com/l/${job.id}`,
          salary:
            job.salary_min && job.salary_max
              ? `$${job.salary_min} - $${job.salary_max}`
              : "",
          source: "RemoteOK",
        }))
        .filter((j: Job) => {
          if (seen.has(j.link)) return false;
          seen.add(j.link);
          return true;
        });
    });
  } catch {
    return [];
  }
}

// ---------- Arbeitnow (free, no key) ----------
async function fetchArbeitnow(keywords: string): Promise<Job[]> {
  try {
    const pages = [1, 2, 3, 4, 5];
    const results = await Promise.all(
      pages.map((page) =>
        fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, {
          cache: "no-store",
        }).then((r) => (r.ok ? r.json() : { data: [] }))
          .catch(() => ({ data: [] }))
      )
    );
    const allJobs: Job[] = results.flatMap((res) =>
      (res.data || []).map((job: Record<string, string | string[]>) => ({
        title: (job.title as string) || "",
        company: (job.company_name as string) || "",
        location: (job.location as string) || "Remote",
        snippet: ((job.description as string) || "").replace(/<[^>]*>/g, "").slice(0, 300),
        link: (job.url as string) || "",
        salary: "",
        source: "Arbeitnow",
      }))
    );
    const kw = (keywords || "software").toLowerCase().split(/\s+/);
    return allJobs.filter((job) => {
      const text = `${job.title} ${job.company} ${job.snippet}`.toLowerCase();
      return kw.some((k) => text.includes(k));
    });
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keywords = "", location = "" } = body;

  const sweKeywords = keywords || "software engineer";
  const cacheKey = `${sweKeywords.toLowerCase().trim()}|${location.toLowerCase().trim()}`;

  await connectDB();

  const cacheKeyWithVersion = `v3|${cacheKey}`;

  const cached = await CachedSearch.findOne({ key: cacheKeyWithVersion }).lean();
  if (cached) {
    return NextResponse.json({ jobs: filterByLocation(cached.jobs as Job[], location) });
  }

  const [himalayasJobs, remotiveJobs, remoteOKJobs, arbeitnowJobs] =
    await Promise.all([
      // fetchJooble(sweKeywords, location),
      // fetchUSAJobs(sweKeywords, location),
      fetchHimalayas(sweKeywords),
      fetchRemotive(keywords),
      fetchRemoteOK(),
      fetchArbeitnow(sweKeywords),
    ]);

  const allJobs = [
    // ...joobleJobs,
    // ...usajobsJobs,
    ...himalayasJobs,
    ...remotiveJobs,
    ...remoteOKJobs,
    ...arbeitnowJobs,
  ];

  // Deduplicate by link
  const seen = new Set<string>();
  const deduped = allJobs.filter((job) => {
    if (!job.link || seen.has(job.link)) return false;
    seen.add(job.link);
    return true;
  });

  // Filter to SWE-related jobs only
  const sweJobs = deduped.filter(isSWEJob);

  // Filter by location
  const jobs = filterByLocation(sweJobs, location);

  await CachedSearch.findOneAndUpdate(
    { key: cacheKeyWithVersion },
    { key: cacheKeyWithVersion, jobs: sweJobs },
    { upsert: true }
  ).catch(() => {});

  if (jobs.length > 0) {
    const ops = jobs
      .filter((job) => job.link)
      .map((job) => ({
        updateOne: {
          filter: { link: job.link },
          update: {
            $setOnInsert: {
              slug: toSlug(job.title) + "-" + Math.random().toString(36).slice(2, 10),
              title: job.title,
              company: job.company,
              location: job.location,
              snippet: job.snippet,
              link: job.link,
              salary: job.salary,
              source: job.source,
            },
          },
          upsert: true,
        },
      }));
    await SavedJob.bulkWrite(ops, { ordered: false }).catch(() => {});
  }

  return NextResponse.json({ jobs });
}
