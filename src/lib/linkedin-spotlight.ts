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

type Facts = { work: string; lookingFor: string; term: string; where: string };

// Recruiter-speak that makes posts read as generated; any draft using these falls back to the job's own words.
const FILLER =
  /\b(dive|delve|kickstart|jump-?start|exciting|elevate|unlock|journey|cutting[- ]edge|dynamic|innovative|shape the future|thrive|passion(ate)?|hands-on|game[- ]changer|don'?t miss|dream (job|role)|key to success|essential|seize|embark|leverage|world of|look no further|opportunity awaits|join (a|an|the|us)\b)/i;

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

function clean(value: unknown, max: number) {
  const v = String(value ?? "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return v && v.length <= max && !/[#*_`]/.test(v) ? v : "";
}

async function extractFacts(job: SpotlightJob): Promise<Facts | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const prompt = `Pull the concrete facts out of this job posting for a short, plain LinkedIn post. Write like an engineer telling a friend about a role: specific, flat, no selling.

Role: ${job.title}
Type: ${job.experienceType}
Location: ${job.location}
Posting: ${job.snippet.slice(0, 2000)}

Return JSON with:
- "work": what the person will actually build or work on, naming the real systems, products or tech from the posting. Lowercase start, no leading verb like "you'll". At most 110 characters. Example: "LLVM-based compilers for CPUs and GPUs, mostly optimization passes and debugging"
- "lookingFor": the 2–4 most specific requirements, comma-separated, as short noun phrases. At most 90 characters. Example: "C++, compiler or toolchain coursework, enrolled in a CS degree"
- "where": the location as a reader would say it, city and state/province abbreviation plus Remote/Hybrid if stated, no street addresses or office codes. At most 60 characters. Example: "San Francisco, CA (hybrid)"
- "term": start date, season or duration if the posting states one (e.g. "Summer 2027", "16 months from May 2027"), else ""

Rules: only facts stated in the posting; never invent. No adjectives like exciting, dynamic, innovative, cutting-edge, hands-on. No emoji, hashtags, links or markdown. Never mention the company name ("${job.company}").`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const facts = { work: clean(parsed.work, 130), lookingFor: clean(parsed.lookingFor, 110), term: clean(parsed.term, 40), where: clean(parsed.where, 70) };
    if (!facts.work || !facts.lookingFor) return null;
    const all = `${facts.work} ${facts.lookingFor} ${facts.term}`;
    if (FILLER.test(all) || mentionsCompany(all, job.company)) return null;
    return facts;
  } catch {
    return null;
  }
}

function lowerFirst(s: string) {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

function buildPost(job: SpotlightJob, facts: Facts | null, countLabel: string) {
  const details = facts
    ? [
        `What you'd work on: ${lowerFirst(facts.work)}.`,
        `They're looking for: ${facts.lookingFor}.`,
        ...(facts.term ? [`When: ${facts.term}`] : []),
      ]
    : [firstSentences(job.snippet, 260)];
  const lines = [
    job.title,
    `${facts?.where || job.location}${job.salary ? ` · ${job.salary}` : ""}`,
    "",
    ...details,
    "",
    `Apply: https://reblet.com/jobs/${job.slug}`,
    "",
    `${countLabel} more SWE internships and new grad jobs: https://reblet.com/jobs`,
    "",
    [...roleTags(job), ...REGION_TAGS, "#Reblet"].join(" "),
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
    let content = buildPost(job, await extractFacts(job), countLabel);
    if (content.length > LINKEDIN_MAX_CHARS) content = content.slice(0, LINKEDIN_MAX_CHARS);
    drafts.push({ slug: job.slug, title: job.title, content });
  }
  return drafts;
}
