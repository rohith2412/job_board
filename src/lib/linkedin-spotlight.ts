import { connectDB } from "@/lib/mongodb";
import { LINKEDIN_MAX_CHARS } from "@/lib/linkedin";
import { LinkedInPost, type PostKind } from "@/models/LinkedInPost";
import { SavedJob } from "@/models/SavedJob";
import { Visit } from "@/models/Visit";
import { FeaturedStudent, type IFeaturedStudent } from "@/models/FeaturedStudent";
import { REAL_VISITS } from "@/lib/analytics";
import { getAllPosts } from "@/lib/blog";

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

// Roundups and "most viewed" lists repeat jobs on purpose, so only single-job posts mark a job as used.
const SPOTLIGHT_USED = { kind: { $nin: ["roundup", "popular"] } };

async function unpostedJobs(count: number, exclude: string[] = []) {
  const used = await LinkedInPost.distinct("jobSlugs", SPOTLIGHT_USED);
  return (await SavedJob.find({ featured: true, slug: { $nin: [...used, ...exclude] } })
    .sort({ createdAt: -1 })
    .limit(count)
    .select("slug title company location salary experienceType snippet")
    .lean()) as unknown as SpotlightJob[];
}

async function spotlightContent(job: SpotlightJob, countLabel: string) {
  const content = buildPost(job, await extractFacts(job), countLabel);
  return content.length > LINKEDIN_MAX_CHARS ? content.slice(0, LINKEDIN_MAX_CHARS) : content;
}

// ---- Daily mix: spotlights, a roundup, and a rotating post ----

export type SlotType = "spotlight" | "roundup" | "rotating";
export type PlanDraft = { when: string; kind: PostKind; ref?: string; jobSlugs: string[]; title: string; content: string };

const DAY = 24 * 60 * 60 * 1000;
const ROUNDUP_SIZE = 5;
const POPULAR_COOLDOWN = 6 * DAY;
const REPEAT_COOLDOWN = 30 * DAY;

// Turns raw posting locations ("SFA01 - 984 Folsom Street, United States of America") into something readable.
function shortLocation(location: string) {
  const first = location.split(/[;|]/)[0]
    .replace(/^[A-Z0-9]{3,6}\s*-\s*\d*[^,]*,\s*/, "")
    .replace(/United States of America|United States/g, "USA")
    .trim();
  return first.length > 48 ? `${first.slice(0, 45).trim()}…` : first;
}

function jobLines(jobs: { slug: string; title: string; location: string }[], numbered = false) {
  return jobs.flatMap((j, i) => [
    `${numbered ? `${i + 1}. ` : ""}${j.title}${j.location ? ` · ${shortLocation(j.location)}` : ""}`,
    `https://reblet.com/jobs/${j.slug}`,
    "",
  ]);
}

async function roundupDraft(when: string, exclude: Set<string>, countLabel: string): Promise<PlanDraft | null> {
  const inRoundups = await LinkedInPost.distinct("jobSlugs", { kind: "roundup" });
  const jobs = (await SavedJob.find({
    featured: true,
    createdAt: { $gte: new Date(Date.now() - 10 * DAY) },
    slug: { $nin: [...inRoundups, ...exclude] },
  })
    .sort({ createdAt: -1 })
    .limit(ROUNDUP_SIZE)
    .select("slug title location")
    .lean()) as unknown as { slug: string; title: string; location: string }[];
  if (jobs.length < 3) return null;
  jobs.forEach((j) => exclude.add(j.slug));
  const content = [
    `${jobs.length} new SWE internships and new grad roles on Reblet`,
    "",
    ...jobLines(jobs),
    `All ${countLabel} open roles: https://reblet.com/jobs`,
    "",
    "#Internship #NewGrad #SoftwareEngineering #CanadaJobs #USJobs #IndiaJobs #Reblet",
  ].join("\n");
  return { when, kind: "roundup", jobSlugs: jobs.map((j) => j.slug), title: `Roundup of ${jobs.length} new roles`, content };
}

async function popularDraft(when: string, recent: Date[], countLabel: string): Promise<PlanDraft | null> {
  if (recent.some((d) => Math.abs(d.getTime() - new Date(when).getTime()) < POPULAR_COOLDOWN)) return null;
  const top = await Visit.aggregate<{ _id: string; views: number }>([
    { $match: { ...REAL_VISITS, createdAt: { $gte: new Date(Date.now() - 7 * DAY) }, path: /^\/jobs\/[^/]+$/ } },
    { $group: { _id: { $substrCP: ["$path", 6, 300] }, views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 30 },
  ]);
  const bySlug = new Map(
    ((await SavedJob.find({ slug: { $in: top.map((t) => t._id) } }).select("slug title location").lean()) as unknown as {
      slug: string;
      title: string;
      location: string;
    }[]).map((j) => [j.slug, j])
  );
  const jobs = top.map((t) => bySlug.get(t._id)).filter((j) => j !== undefined).slice(0, 5);
  if (jobs.length < 3) return null;
  const content = [
    "The most viewed roles on Reblet this week",
    "",
    ...jobLines(jobs, true),
    `All ${countLabel} open roles: https://reblet.com/jobs`,
    "",
    "#Internship #NewGrad #SoftwareEngineering #CanadaJobs #USJobs #IndiaJobs #Reblet",
  ].join("\n");
  return { when, kind: "popular", jobSlugs: jobs.map((j) => j.slug), title: "Most viewed this week", content };
}

function blogDraft(when: string, sharedAt: Map<string, Date>): PlanDraft | null {
  const at = new Date(when).getTime();
  const candidates = getAllPosts()
    .filter((p) => {
      const last = sharedAt.get(p.slug);
      return !last || at - last.getTime() > REPEAT_COOLDOWN;
    })
    // Never-shared posts first, newest first; then the one shared longest ago.
    .sort((a, b) => (sharedAt.get(a.slug)?.getTime() ?? 0) - (sharedAt.get(b.slug)?.getTime() ?? 0) || b.date.localeCompare(a.date));
  const post = candidates[0];
  if (!post) return null;
  sharedAt.set(post.slug, new Date(when));
  const content = [
    post.title,
    "",
    post.description,
    "",
    `Read it on the Reblet blog: https://reblet.com/blog/${post.slug}`,
    "",
    "#Internship #SoftwareEngineering #CareerAdvice #Reblet",
  ].join("\n");
  return { when, kind: "blog", ref: post.slug, jobSlugs: [], title: `Blog: ${post.title}`, content };
}

async function studentDraft(when: string, sharedAt: Map<string, Date>): Promise<PlanDraft | null> {
  const at = new Date(when).getTime();
  const students = (await FeaturedStudent.find({
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date(when) } }],
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as (IFeaturedStudent & { _id: unknown })[];
  const student = students.find((s) => {
    const last = sharedAt.get(String(s._id));
    return !last || at - last.getTime() > REPEAT_COOLDOWN;
  });
  if (!student) return null;
  const id = String(student._id);
  sharedAt.set(id, new Date(when));
  const school = [student.school, student.gradYear ? `Class of ${student.gradYear}` : ""].filter(Boolean).join(" · ");
  const content = [
    `Featured on Reblet: ${student.name}`,
    ...(school ? [school] : []),
    "",
    ...(student.headline ? [student.headline, ""] : []),
    ...student.highlights.slice(0, 3).map((h) => `• ${h.text}`),
    ...(student.highlights.length ? [""] : []),
    ...(student.skills?.length ? [`Skills: ${student.skills.slice(0, 6).join(", ")}`, ""] : []),
    ...(/linkedin\.com\/in\/[^/?#]+/i.test(student.linkedin ?? "") ? [`LinkedIn: ${student.linkedin}`, ""] : []),
    "Hiring interns? Meet the students featured on Reblet: https://reblet.com/jobs#featured-students",
    "",
    "#Hiring #Internship #SoftwareEngineering #Reblet",
  ].join("\n");
  return { when, kind: "student", ref: id, jobSlugs: [], title: `Featured student: ${student.name}`, content };
}

// Drafts one post per slot. Writes nothing; scheduling happens separately.
export async function draftDailyPlan(slots: { when: string; type: SlotType }[]): Promise<PlanDraft[]> {
  await connectDB();
  const [totalJobs, history] = await Promise.all([
    SavedJob.countDocuments({ featured: true }),
    LinkedInPost.find({ kind: { $in: ["popular", "blog", "student"] } })
      .select("kind ref scheduledFor createdAt")
      .lean() as unknown as Promise<{ kind: PostKind; ref?: string; scheduledFor?: Date; createdAt: Date }[]>,
  ]);
  const countLabel = jobCountLabel(totalJobs);
  const dateOf = (p: { scheduledFor?: Date; createdAt: Date }) => new Date(p.scheduledFor ?? p.createdAt);
  const popularAt = history.filter((p) => p.kind === "popular").map(dateOf);
  const lastShared = (kind: PostKind) => {
    const m = new Map<string, Date>();
    for (const p of history) if (p.kind === kind && p.ref && (!m.get(p.ref) || dateOf(p) > m.get(p.ref)!)) m.set(p.ref, dateOf(p));
    return m;
  };
  const blogShared = lastShared("blog");
  const studentShared = lastShared("student");

  const spotlightCount = slots.length;
  const pool = await unpostedJobs(spotlightCount);
  const usedInBatch = new Set<string>();
  const nextSpotlight = async (when: string): Promise<PlanDraft | null> => {
    const job = pool.find((j) => !usedInBatch.has(j.slug));
    if (!job) return null;
    usedInBatch.add(job.slug);
    return { when, kind: "spotlight", jobSlugs: [job.slug], title: job.title, content: await spotlightContent(job, countLabel) };
  };

  const rotation = ["popular", "student", "blog"] as const;
  let turn = 0;
  const inBatchRoundups = new Set<string>();
  const drafts: PlanDraft[] = [];
  for (const slot of slots) {
    let draft: PlanDraft | null = null;
    if (slot.type === "roundup") draft = await roundupDraft(slot.when, inBatchRoundups, countLabel);
    if (slot.type === "rotating") {
      for (let i = 0; i < rotation.length && !draft; i++) {
        const kind = rotation[(turn + i) % rotation.length];
        if (kind === "popular") {
          draft = await popularDraft(slot.when, popularAt, countLabel);
          if (draft) popularAt.push(new Date(slot.when));
        } else if (kind === "student") draft = await studentDraft(slot.when, studentShared);
        else draft = blogDraft(slot.when, blogShared);
      }
      turn++;
    }
    // Any slot whose own format has nothing new to say falls back to a job spotlight.
    draft ??= await nextSpotlight(slot.when);
    if (draft) drafts.push(draft);
  }
  return drafts;
}
