import mongoose from "mongoose";
import { revalidatePath, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { crawlFeeds, smartRecruitersDescription, type Ats, type FeedJob } from "@/lib/job-feeds";
import { FEED_SOURCES } from "@/lib/job-feed-sources";
import { COMPANY_LOGOS_TAG, ensureCompanyLogo } from "@/lib/company-logos";
import { JobCandidate, type IJobCandidate } from "@/models/JobCandidate";
import { SavedJob } from "@/models/SavedJob";

const SOURCE_LABELS: Record<Ats, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
};

const AUTO_ADD_DAYS = 7;
const AUTO_ADD_PER_RUN = 40;
const AUTO_ADD_ID = "job-auto-add";

function settings() {
  return mongoose.connection.collection<{ _id: string; enabled: boolean; updatedAt: Date }>("settings");
}

// Auto-add is on unless the admin turned it off.
export async function getAutoAdd() {
  await connectDB();
  const doc = await settings().findOne({ _id: AUTO_ADD_ID });
  return { enabled: doc ? doc.enabled : true, days: AUTO_ADD_DAYS };
}

export async function setAutoAdd(enabled: boolean) {
  await connectDB();
  await settings().updateOne({ _id: AUTO_ADD_ID }, { $set: { enabled, updatedAt: new Date() } }, { upsert: true });
  return getAutoAdd();
}

// Approves queued roles the company published within the last week, newest first.
export async function autoAddRecent() {
  const { enabled } = await getAutoAdd();
  if (!enabled) return { added: 0, skipped: 0 };
  const ids = (await JobCandidate.find({
    status: "pending",
    closed: false,
    postedAt: { $gte: new Date(Date.now() - AUTO_ADD_DAYS * 86_400_000) },
  })
    .sort({ postedAt: -1 })
    .limit(AUTO_ADD_PER_RUN)
    .select("_id")
    .lean()) as unknown as { _id: unknown }[];
  if (!ids.length) return { added: 0, skipped: 0 };
  const result = await approveCandidates(ids.map((c) => String(c._id)));
  return { added: result.approved.length, skipped: result.failed.length };
}

// Reads every company feed and queues new matching roles for review. Roles already on Reblet are skipped,
// and roles published within the last week are added automatically when auto-add is on.
export async function syncFeeds() {
  await connectDB();
  const crawl = await crawlFeeds(FEED_SOURCES);
  const urls = crawl.matches.map((m) => m.applyUrl);
  const onReblet = new Set(
    ((await SavedJob.find({ $or: [{ link: { $in: urls } }, { applyUrl: { $in: urls } }] }).select("link applyUrl").lean()) as unknown as {
      link: string;
      applyUrl?: string;
    }[]).flatMap((j) => [j.link, j.applyUrl])
  );

  const now = new Date();
  const fresh = crawl.matches.filter((m) => !onReblet.has(m.applyUrl));
  const result = fresh.length
    ? await JobCandidate.bulkWrite(
        fresh.map((m: FeedJob) => ({
          updateOne: {
            filter: { key: m.key },
            update: {
              $setOnInsert: {
                key: m.key,
                ats: m.ats,
                token: m.token,
                company: m.company,
                title: m.title,
                location: m.location,
                applyUrl: m.applyUrl,
                description: m.description.slice(0, 8000),
                salary: m.salary,
                status: "pending",
                firstSeenAt: now,
              },
              // Publish dates are refreshed every run so a corrected feed date replaces an old one.
              $set: { lastSeenAt: now, closed: false, ...(m.postedAt ? { postedAt: new Date(m.postedAt) } : {}) },
              ...(m.postedAt ? {} : { $unset: { postedAt: "" } }),
            },
            upsert: true,
          },
        }))
      )
    : null;

  // A pending role that vanished from a feed we read successfully has been taken down.
  const failed = new Set(crawl.failures.map((f) => f.company));
  const readTokens = FEED_SOURCES.filter((s) => !failed.has(s.company)).map((s) => s.token);
  const closed = await JobCandidate.updateMany(
    { status: "pending", closed: false, token: { $in: readTokens }, lastSeenAt: { $lt: now } },
    { $set: { closed: true } }
  );

  const auto = await autoAddRecent();

  return {
    companies: FEED_SOURCES.length,
    scanned: crawl.scanned,
    matched: crawl.matches.length,
    added: result?.upsertedCount ?? 0,
    autoAdded: auto.added,
    closed: closed.modifiedCount,
    failures: crawl.failures,
  };
}

function slugify(title: string, company: string) {
  return `${title} at ${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string) {
  for (let n = 1; n < 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await SavedJob.exists({ slug }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function guessType(title: string) {
  if (/co-?op/i.test(title)) return "Co-op";
  if (/intern/i.test(title)) return "Internship";
  return "Full-time";
}

type Details = { location: string; salary: string; experienceType: string; snippet: string };

// Same shape the admin "post a job" flow writes, so approved roles look like every other job on Reblet.
async function writeDetails(c: IJobCandidate, description: string): Promise<Details | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !description) return null;
  const prompt = `Extract job details from this posting and return ONLY valid JSON with these fields:
{
  "location": "city, state/province, or Remote; list at most three locations, US and Canada first",
  "salary": "the salary exactly as the posting states it, with currency and unit, e.g. \"$57–$61 per hour\" or \"$120,000–$150,000 per year\"; empty string if not mentioned",
  "experienceType": "Internship" or "Full-time" or "Co-op" or "Contract",
  "snippet": "a clean description of the role (2-3 paragraphs covering what the role does, requirements, and any perks). Plain text, no markdown, no bullet points, no headers."
}

Title: ${c.title}
Company: ${c.company}
Location: ${c.location}
Salary: ${c.salary || "not listed"}
Posting:
${description.slice(0, 6000)}`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (!parsed.snippet) return null;
    return {
      location: String(parsed.location || c.location),
      // The feed's own pay text (with currency and unit) beats the model's rewording.
      salary: c.salary || (/\$|£|€|₹|cad|usd|hour|hr|year|yr|month|annual/i.test(String(parsed.salary)) ? String(parsed.salary) : ""),
      experienceType: ["Internship", "Full-time", "Co-op", "Contract"].includes(parsed.experienceType) ? parsed.experienceType : guessType(c.title),
      snippet: String(parsed.snippet),
    };
  } catch {
    return null;
  }
}

export async function approveCandidates(ids: string[]) {
  await connectDB();
  const candidates = (await JobCandidate.find({ _id: { $in: ids }, status: "pending" }).lean()) as unknown as (IJobCandidate & { _id: unknown })[];
  const approved: { id: string; slug: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  const queue = [...candidates];
  async function worker() {
    for (let c = queue.shift(); c; c = queue.shift()) await approveOne(c);
  }
  async function approveOne(c: IJobCandidate & { _id: unknown }) {
    const id = String(c._id);
    try {
      if (await SavedJob.exists({ $or: [{ link: c.applyUrl }, { applyUrl: c.applyUrl }] })) {
        await JobCandidate.updateOne({ _id: c._id }, { $set: { status: "rejected" } });
        failed.push({ id, error: "Already on Reblet" });
        return;
      }
      let description = c.description;
      if (!description && c.ats === "smartrecruiters") {
        description = await smartRecruitersDescription(c.token, c.key.split(":").pop() ?? "").catch(() => "");
      }
      const details = await writeDetails(c, description);
      const slug = await uniqueSlug(slugify(c.title, c.company));
      await SavedJob.create({
        slug,
        title: c.title,
        company: c.company,
        location: details?.location ?? c.location.split(";").slice(0, 3).join(";"),
        salary: details?.salary ?? c.salary,
        snippet: details?.snippet ?? description.slice(0, 1200),
        link: c.applyUrl,
        applyUrl: c.applyUrl,
        source: SOURCE_LABELS[c.ats],
        featured: true,
        experienceType: details?.experienceType ?? guessType(c.title),
      });
      await JobCandidate.updateOne({ _id: c._id }, { $set: { status: "approved", jobSlug: slug } });
      const domain = FEED_SOURCES.find((s) => s.token === c.token && s.ats === c.ats)?.domain;
      if (domain) await ensureCompanyLogo(c.company, domain).catch(() => "");
      revalidatePath(`/jobs/${slug}`);
      approved.push({ id, slug });
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Could not add the job" });
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, candidates.length) }, worker));

  if (approved.length) {
    revalidatePath("/jobs");
    revalidatePath("/");
  }
  return { approved, failed };
}

export async function rejectCandidates(ids: string[]) {
  await connectDB();
  const res = await JobCandidate.updateMany({ _id: { $in: ids }, status: "pending" }, { $set: { status: "rejected" } });
  return { rejected: res.modifiedCount };
}

// Saves logos for every feed company, and restores the feed's exact pay text on roles already approved.
export async function backfillFeedJobs() {
  await connectDB();
  let logos = 0;
  const missing: string[] = [];
  const queue = [...FEED_SOURCES];
  async function worker() {
    for (let src = queue.shift(); src; src = queue.shift()) {
      const url = await ensureCompanyLogo(src.company, src.domain, { revalidate: false }).catch(() => "");
      if (url) logos++;
      else missing.push(src.company);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  const approved = (await JobCandidate.find({ status: "approved", jobSlug: { $exists: true }, salary: { $ne: "" } })
    .select("jobSlug salary")
    .lean()) as unknown as { jobSlug: string; salary: string }[];
  let salaries = 0;
  for (const c of approved) {
    const res = await SavedJob.updateOne({ slug: c.jobSlug, salary: { $ne: c.salary } }, { $set: { salary: c.salary } });
    if (res.modifiedCount) {
      salaries++;
      revalidatePath(`/jobs/${c.jobSlug}`);
    }
  }
  revalidateTag(COMPANY_LOGOS_TAG, "max");
  revalidatePath("/jobs");
  return { logos, missing, salaries };
}
