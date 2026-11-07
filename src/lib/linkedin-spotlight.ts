import { connectDB } from "@/lib/mongodb";
import { LINKEDIN_MAX_CHARS } from "@/lib/linkedin";
import { LinkedInPost } from "@/models/LinkedInPost";
import { SavedJob } from "@/models/SavedJob";

// Reaches students job-hunting in Canada, the US and India alongside the role tags.
const REGION_TAGS = ["#CanadaJobs", "#USJobs", "#IndiaJobs", "#StudentsInCanada", "#IndianStudents"];

type SpotlightJob = {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  experienceType: string;
  snippet: string;
};

export type SpotlightDraft = { slug: string; title: string; content: string };

// Rounds down to a tens bucket so the claim is always true ("97 jobs" -> "90+").
export function jobCountLabel(count: number) {
  if (count < 10) return `${count}`;
  return `${Math.floor(count / 10) * 10}+`;
}

function roleTags(job: SpotlightJob) {
  const kind = `${job.experienceType} ${job.title}`.toLowerCase();
  if (/co-?op/.test(kind)) return ["#Coop", "#Internship"];
  if (/intern/.test(kind)) return ["#Internship", "#SoftwareEngineering"];
  return ["#NewGrad", "#SoftwareEngineering"];
}

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

async function writeHook(job: SpotlightJob): Promise<{ hook: string; summary: string } | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const prompt = `Write a short LinkedIn spotlight for one job on Reblet, a job board for software engineering interns and new grads in Canada, the US and India.

Role: ${job.title}
Type: ${job.experienceType}
Location: ${job.location}
Details: ${job.snippet.slice(0, 1500)}

Return JSON with:
- "hook": one punchy opening line, starting with a single emoji that fits this specific role (vary it; avoid 🚀), at most 80 characters
- "summary": one or two plain sentences, at most 220 characters, saying what the intern will actually work on and one key requirement or perk

Rules: never mention the company name ("${job.company}"); plain text only, no markdown, no hashtags, no links.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
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

function buildPost(job: SpotlightJob, hook: string, summary: string, countLabel: string) {
  const lines = [
    hook,
    "",
    job.title,
    `📍 ${job.location}`,
    ...(job.salary ? [`💰 ${job.salary}`] : []),
    "",
    summary,
    "",
    `Apply on Reblet 👉 https://reblet.com/jobs/${job.slug}`,
    "",
    `${countLabel} SWE internships and new grad jobs available → https://reblet.com/jobs`,
    "",
    [...roleTags(job), "#TechJobs", ...REGION_TAGS, "#Reblet"].join(" "),
  ];
  return lines.join("\n");
}

// Drafts one post per job for the newest jobs that haven't appeared in any LinkedIn post yet. Writes nothing.
export async function draftSpotlights(count: number): Promise<SpotlightDraft[]> {
  await connectDB();
  const [usedSlugs, totalJobs] = await Promise.all([
    LinkedInPost.distinct("jobSlugs"),
    SavedJob.countDocuments({ featured: true }),
  ]);
  const jobs = (await SavedJob.find({ featured: true, slug: { $nin: usedSlugs } })
    .sort({ createdAt: -1 })
    .limit(count)
    .select("slug title company location salary experienceType snippet")
    .lean()) as unknown as SpotlightJob[];

  const countLabel = jobCountLabel(totalJobs);
  const drafts: SpotlightDraft[] = [];
  for (const job of jobs) {
    const ai = await writeHook(job);
    const hook = ai?.hook ?? `🚀 New ${job.experienceType.toLowerCase()} opening for students`;
    const summary = ai?.summary ?? firstSentences(job.snippet, 220);
    let content = buildPost(job, hook, summary, countLabel);
    if (content.length > LINKEDIN_MAX_CHARS) content = content.slice(0, LINKEDIN_MAX_CHARS);
    drafts.push({ slug: job.slug, title: job.title, content });
  }
  return drafts;
}
