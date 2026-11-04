import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const SEARCH_URL =
  "https://www.linkedin.com/jobs/search/?keywords=software+engineering+internship+summer+2027&f_TPR=r86400&location=United+States&position=1&pageNum=0";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_JOBS = 10;

function generateSlug(title: string, company: string): string {
  return `${title} at ${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchLinkedInJobUrls(): Promise<string[]> {
  const res = await fetch(SEARCH_URL, {
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`LinkedIn search returned ${res.status}`);
  const html = await res.text();

  const urls: string[] = [];
  const seen = new Set<string>();
  const regex = /href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"?]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

async function fetchJobPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();

  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );
  let jsonLdText = "";
  if (jsonLdMatch) {
    jsonLdText = jsonLdMatch
      .map((m) => m.replace(/<script[^>]*>/, "").replace(/<\/script>/, "").trim())
      .join("\n\n");
  }

  const pageText = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  return jsonLdText
    ? "JSON-LD structured data:\n" + jsonLdText + "\n\nPage text:\n" + pageText
    : pageText;
}

async function extractJobWithAI(
  pageText: string,
  openaiKey: string
): Promise<{
  title: string;
  company: string;
  location: string;
  salary: string;
  experienceType: string;
  snippet: string;
} | null> {
  const prompt = `Extract job details from this webpage content. Return ONLY valid JSON with these fields:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, state or Remote",
  "salary": "salary range if mentioned, empty string if not",
  "experienceType": "Internship" or "Full-time" or "Co-op" or "Contract",
  "snippet": "a clean, well-formatted description of the role (2-3 paragraphs covering what the role does, requirements, and any perks/benefits). Write it in plain text, no markdown, no bullet points, no headers. Make it read naturally."
}

Webpage content:
${pageText}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.company) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let jobUrls: string[];
  try {
    jobUrls = await fetchLinkedInJobUrls();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to search LinkedIn: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }

  if (jobUrls.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0, errors: [], message: "No jobs found on LinkedIn" });
  }

  await connectDB();

  const existingLinks = await SavedJob.find(
    { link: { $in: jobUrls } },
    { link: 1 }
  ).lean();
  const existingSet = new Set(existingLinks.map((j) => (j as { link: string }).link));

  const newUrls = jobUrls.filter((u) => !existingSet.has(u)).slice(0, MAX_JOBS);

  let imported = 0;
  const skipped = jobUrls.length - newUrls.length;
  const errors: string[] = [];
  const importedJobs: string[] = [];

  for (const url of newUrls) {
    try {
      const pageText = await fetchJobPage(url);
      await delay(300);

      const job = await extractJobWithAI(pageText, openaiKey);
      if (!job) {
        errors.push(`${url}: AI extraction failed`);
        continue;
      }

      const slug = generateSlug(job.title, job.company);
      const existing = await SavedJob.findOne({ slug });
      if (existing) {
        errors.push(`${job.title} at ${job.company}: slug already exists`);
        continue;
      }

      await SavedJob.create({
        slug,
        title: job.title,
        company: job.company,
        location: job.location || "",
        salary: job.salary || "",
        snippet: job.snippet || "",
        link: url,
        applyUrl: url,
        source: "linkedin-auto",
        featured: true,
        experienceType: job.experienceType || "Internship",
        postedByEmail: ADMIN_EMAIL,
      });

      importedJobs.push(`${job.title} at ${job.company}`);
      imported++;
      await delay(200);
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (imported > 0) {
    revalidatePath("/jobs");
    revalidatePath("/");
  }

  return NextResponse.json({
    imported,
    skipped,
    total: jobUrls.length,
    errors,
    jobs: importedJobs,
  });
}
