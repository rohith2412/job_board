import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { crawlFeeds, smartRecruitersDescription, type Ats, type FeedJob } from "@/lib/job-feeds";
import { FEED_SOURCES } from "@/lib/job-feed-sources";
import { JobCandidate, type IJobCandidate } from "@/models/JobCandidate";
import { SavedJob } from "@/models/SavedJob";

const SOURCE_LABELS: Record<Ats, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
};

// Reads every company feed and queues new matching roles for review. Roles already on Reblet are skipped.
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
                ...(m.postedAt ? { postedAt: new Date(m.postedAt) } : {}),
                status: "pending",
                firstSeenAt: now,
              },
              $set: { lastSeenAt: now, closed: false },
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

  return {
    companies: FEED_SOURCES.length,
    scanned: crawl.scanned,
    matched: crawl.matches.length,
    added: result?.upsertedCount ?? 0,
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
  "salary": "salary range if mentioned, empty string if not",
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
      salary: String(parsed.salary || c.salary || ""),
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

  for (const c of candidates) {
    const id = String(c._id);
    try {
      if (await SavedJob.exists({ $or: [{ link: c.applyUrl }, { applyUrl: c.applyUrl }] })) {
        await JobCandidate.updateOne({ _id: c._id }, { $set: { status: "rejected" } });
        failed.push({ id, error: "Already on Reblet" });
        continue;
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
      revalidatePath(`/jobs/${slug}`);
      approved.push({ id, slug });
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "Could not add the job" });
    }
  }

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
