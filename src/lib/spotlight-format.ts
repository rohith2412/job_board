// Pure formatting for LinkedIn job posts: several single-job layouts plus a multi-job roundup,
// so the feed doesn't show the same template every time. No database or network access here.

export type SpotlightJob = {
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  experienceType: string;
  snippet: string;
};

export const JOB_URL = (slug: string) => `https://reblet.com/jobs/${slug}`;
export const JOBS_URL = "https://reblet.com/jobs";

// Opening styles handed to the AI so hooks don't all read alike.
export const HOOK_STYLES = [
  "a direct question a student would ask themselves",
  "a short, confident statement about the opportunity",
  "a casual heads-up, like telling a friend about it",
  "lead with the most eye-catching fact (pay, remote, or the tech used)",
  "a deadline-style nudge without inventing any specific date",
] as const;

// Rounds down to a tens bucket so the claim is always true ("97 jobs" -> "90+").
export function jobCountLabel(count: number) {
  if (count < 10) return `${count}`;
  return `${Math.floor(count / 10) * 10}+`;
}

function pick<T>(list: readonly T[], n: number) {
  return list[((n % list.length) + list.length) % list.length];
}

function roleTags(job: SpotlightJob) {
  const kind = `${job.experienceType} ${job.title}`.toLowerCase();
  if (/co-?op/.test(kind)) return ["#Coop", "#Internship"];
  if (/intern/.test(kind)) return ["#Internship", "#SoftwareEngineering"];
  return ["#NewGrad", "#SoftwareEngineering"];
}

// Region tags follow the job's location instead of tagging every country on every post.
function regionTags(locations: string[]) {
  const text = locations.join(" ").toLowerCase();
  const tags: string[] = [];
  if (/canada|\b(ab|bc|on|qc|ns|mb|sk)\b|toronto|vancouver|montreal|calgary|ottawa|waterloo/.test(text)) {
    tags.push("#CanadaJobs", "#StudentsInCanada");
  }
  if (/united states|\busa?\b|\b(ny|wa|tx|ma|il)\b|new york|san francisco|seattle|austin|boston/.test(text)) {
    tags.push("#USJobs");
  }
  if (/india|bangalore|bengaluru|hyderabad|pune|mumbai|delhi|chennai|gurgaon|noida/.test(text)) {
    tags.push("#IndiaJobs", "#IndianStudents");
  }
  return tags.length ? tags : ["#CanadaJobs", "#USJobs", "#IndiaJobs"];
}

function hashtags(base: string[], locations: string[], variant: number) {
  const extra = pick([["#TechJobs"], ["#Hiring"], ["#StudentJobs"], ["#TechCareers"]], variant);
  return [...new Set([...base, ...extra, ...regionTags(locations), "#Reblet"])].join(" ");
}

function moreJobsLine(countLabel: string, variant: number) {
  return pick(
    [
      `${countLabel} SWE internships and new grad jobs available → ${JOBS_URL}`,
      `Browse ${countLabel} more student tech roles → ${JOBS_URL}`,
      `Not your fit? ${countLabel} other internships and new grad jobs → ${JOBS_URL}`,
      `More roles like this (${countLabel} and counting) → ${JOBS_URL}`,
    ],
    variant
  );
}

function applyLine(job: SpotlightJob, variant: number) {
  return pick(
    [`Apply on Reblet 👉 ${JOB_URL(job.slug)}`, `Details + apply → ${JOB_URL(job.slug)}`, `🔗 ${JOB_URL(job.slug)}`],
    variant
  );
}

// Four layouts, rotated by `variant`, so back-to-back posts never share a template.
export function buildSingle(job: SpotlightJob, hook: string, summary: string, countLabel: string, variant: number) {
  const tags = hashtags(roleTags(job), [job.location], variant);
  const pay = job.salary ? job.salary : "";
  const layouts: string[][] = [
    // Classic card
    [
      hook,
      "",
      job.title,
      `📍 ${job.location}`,
      ...(pay ? [`💰 ${pay}`] : []),
      "",
      summary,
      "",
      applyLine(job, variant),
      "",
      moreJobsLine(countLabel, variant),
      "",
      tags,
    ],
    // Summary first, details in one line
    [
      hook,
      "",
      summary,
      "",
      `👉 ${job.title} · ${job.location}${pay ? ` · ${pay}` : ""}`,
      applyLine(job, variant + 1),
      "",
      tags,
    ],
    // Quick facts checklist
    [
      hook,
      "",
      `✅ Role: ${job.title}`,
      `✅ Where: ${job.location}`,
      ...(pay ? [`✅ Pay: ${pay}`] : []),
      `✅ Type: ${job.experienceType}`,
      "",
      summary,
      "",
      applyLine(job, variant + 2),
      moreJobsLine(countLabel, variant + 1),
      "",
      tags,
    ],
    // Short and punchy
    [hook, "", `${job.title} (${job.location})`, summary, "", applyLine(job, variant), "", tags],
  ];
  return pick(layouts, variant).join("\n");
}

function shortLocation(location: string) {
  const clean = location.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 37).trimEnd()}...` : clean;
}

// One post listing several jobs, each with its own direct Reblet link.
export function buildRoundup(jobs: SpotlightJob[], countLabel: string, variant: number) {
  const n = jobs.length;
  const header = pick(
    [
      `🔥 ${n} fresh tech roles for students, all open right now`,
      `📌 Save this: ${n} internships and new grad jobs worth applying to`,
      `🎯 ${n} roles I'd apply to this week if I were a student`,
      `🧵 Quick roundup: ${n} SWE openings for interns and new grads`,
    ],
    variant
  );
  const lines = jobs.map((job, i) => `${i + 1}. ${job.title} · ${shortLocation(job.location)}\n${JOB_URL(job.slug)}`);
  const base = jobs.some((j) => /co-?op|intern/i.test(`${j.experienceType} ${j.title}`))
    ? ["#Internship", "#NewGrad"]
    : ["#NewGrad", "#SoftwareEngineering"];
  return [
    header,
    "",
    ...lines.flatMap((l) => [l, ""]),
    `Browse all ${countLabel} → ${JOBS_URL}`,
    "",
    hashtags(base, jobs.map((j) => j.location), variant),
  ].join("\n");
}

// Used when the AI hook isn't available; still varies the emoji and wording.
export function fallbackHook(job: SpotlightJob, variant: number) {
  const type = job.experienceType.toLowerCase() || "tech";
  return pick(
    [
      `💼 New ${type} opening for students`,
      `👀 Looking for a ${type} role? This one's open now`,
      `✨ Fresh ${type} role just added`,
      `📣 Heads up: a new ${type} spot is open`,
    ],
    variant
  );
}
