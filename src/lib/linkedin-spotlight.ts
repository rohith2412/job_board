import { connectDB } from "@/lib/mongodb";
import { LINKEDIN_MAX_CHARS } from "@/lib/linkedin";
import { LinkedInPost } from "@/models/LinkedInPost";
import { SavedJob } from "@/models/SavedJob";
import {
  HOOK_STYLES,
  buildRoundup,
  buildSingle,
  fallbackHook,
  jobCountLabel,
  type SpotlightJob,
} from "@/lib/spotlight-format";

export type SpotlightDraft = { kind: "single" | "roundup"; slugs: string[]; title: string; content: string };

// A roundup with direct links to several jobs goes out after every few single-job posts.
const SINGLES_BETWEEN_ROUNDUPS = 5;
const ROUNDUP_MIN = 5;
const ROUNDUP_MAX = 8;
const ROUNDUP_MIN_SLUGS = 5; // posts tagged with this many jobs are roundups

function firstSentences(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]/g) ?? [clean];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  return (out || clean.slice(0, max)).trim();
}

function mentionsCompany(text: string, company: string) {
  return company.trim().length > 1 && text.toLowerCase().includes(company.trim().toLowerCase());
}

async function writeHook(job: SpotlightJob, style: string): Promise<{ hook: string; summary: string } | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const prompt = `Write a short LinkedIn spotlight for one job on Reblet, a job board for software engineering interns and new grads in Canada, the US and India.

Role: ${job.title}
Type: ${job.experienceType}
Location: ${job.location}
Details: ${job.snippet.slice(0, 1500)}

Return JSON with:
- "hook": one opening line written as ${style}, starting with a single emoji that fits this specific role (avoid 🚀), at most 80 characters
- "summary": one or two plain sentences, at most 220 characters, saying what the intern will actually work on and one key requirement or perk

Rules: never mention the company name ("${job.company}"); don't start with "Kickstart", "Join" or "Exciting"; plain text only, no markdown, no hashtags, no links.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        temperature: 1,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const hook = String(parsed.hook ?? "").trim();
    const summary = String(parsed.summary ?? "").trim();
    if (!hook || !summary || hook.length > 100 || summary.length > 280) return null;
    if (mentionsCompany(`${hook} ${summary}`, job.company)) return null;
    return { hook, summary };
  } catch {
    return null;
  }
}

// Single-job posts made since the latest roundup, so the roundup cadence carries across batches.
async function singlesSinceRoundup() {
  const active = { status: { $in: ["scheduled", "publishing", "posted"] } };
  const last = await LinkedInPost.findOne({ ...active, [`jobSlugs.${ROUNDUP_MIN_SLUGS - 1}`]: { $exists: true } })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean<{ createdAt: Date }>();
  return LinkedInPost.countDocuments({
    ...active,
    "jobSlugs.0": { $exists: true },
    ...(last ? { createdAt: { $gt: last.createdAt } } : {}),
  });
}

const FIELDS = "slug title company location salary experienceType snippet";

// Drafts `count` posts from the newest jobs not yet posted: mostly one job per post, with a
// roundup of several direct job links mixed in every few posts. Writes nothing.
export async function draftSpotlights(count: number): Promise<SpotlightDraft[]> {
  await connectDB();
  const [usedSlugs, totalJobs, sinceRoundup, totalPosts] = await Promise.all([
    LinkedInPost.distinct("jobSlugs"),
    SavedJob.countDocuments({ featured: true }),
    singlesSinceRoundup(),
    LinkedInPost.countDocuments({}),
  ]);
  const fresh = (await SavedJob.find({ featured: true, slug: { $nin: usedSlugs } })
    .sort({ createdAt: -1 })
    .limit(count * ROUNDUP_MAX)
    .select(FIELDS)
    .lean()) as unknown as SpotlightJob[];

  const countLabel = jobCountLabel(totalJobs);
  const drafts: SpotlightDraft[] = [];
  let singles = sinceRoundup;
  let next = 0;

  for (let i = 0; i < count && next < fresh.length; i++) {
    const variant = totalPosts + i;
    const left = fresh.length - next;
    if (singles >= SINGLES_BETWEEN_ROUNDUPS && left >= ROUNDUP_MIN) {
      const size = Math.min(left, ROUNDUP_MIN + (variant % (ROUNDUP_MAX - ROUNDUP_MIN + 1)));
      const jobs = fresh.slice(next, next + size);
      next += size;
      singles = 0;
      drafts.push({
        kind: "roundup",
        slugs: jobs.map((j) => j.slug),
        title: `Roundup: ${jobs.length} jobs`,
        content: buildRoundup(jobs, countLabel, variant).slice(0, LINKEDIN_MAX_CHARS),
      });
      continue;
    }

    const job = fresh[next++];
    const ai = await writeHook(job, HOOK_STYLES[variant % HOOK_STYLES.length]);
    const hook = ai?.hook ?? fallbackHook(job, variant);
    const summary = ai?.summary ?? firstSentences(job.snippet, 220);
    singles++;
    drafts.push({
      kind: "single",
      slugs: [job.slug],
      title: job.title,
      content: buildSingle(job, hook, summary, countLabel, variant).slice(0, LINKEDIN_MAX_CHARS),
    });
  }
  return drafts;
}
