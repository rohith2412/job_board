import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = "rohithra75@gmail.com";

async function verifyUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    clearTimeout(timeout);
    return res.status < 400;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

async function findCareerPageUrl(company: string, title: string, openaiKey: string): Promise<string | null> {
  const words = company.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const slugs: string[] = [];
  slugs.push(words.join(""));
  if (words.length > 1) slugs.push(words.slice(0, -1).join(""));
  if (words.length > 2) slugs.push(words.slice(0, 2).join(""));
  slugs.push(words[0]);

  const urls = slugs.flatMap((s) => [
    `https://job-boards.greenhouse.io/${s}`,
    `https://boards.greenhouse.io/${s}`,
    `https://jobs.lever.co/${s}`,
    `https://jobs.ashbyhq.com/${s}`,
    `https://jobs.smartrecruiters.com/${s}`,
    `https://apply.workable.com/${s}`,
  ]);

  const results = await Promise.all(urls.map(async (url) => ({ url, ok: await verifyUrl(url) })));
  const found = results.find((r) => r.ok);
  if (found) return found.url;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [{ role: "user", content: `What is the direct careers or job application page URL for "${company}"? Return ONLY the URL, nothing else.` }],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const suggested = (data.choices?.[0]?.message?.content || "").trim();
      if (suggested.startsWith("http") && !suggested.includes("linkedin.com") && await verifyUrl(suggested)) {
        return suggested;
      }
    }
  } catch {}

  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  let pageText = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 400 }
      );
    }
    const html = await res.text();

    const jsonLdMatch = html.match(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    );
    let jsonLdText = "";
    if (jsonLdMatch) {
      jsonLdText = jsonLdMatch
        .map((m) => {
          const content = m.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
          return content.trim();
        })
        .join("\n\n");
    }

    pageText = html
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

    if (jsonLdText) {
      pageText = "JSON-LD structured data:\n" + jsonLdText + "\n\nPage text:\n" + pageText;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch URL: ${err}` },
      { status: 400 }
    );
  }

  const prompt = `Extract job details from this webpage content. Return ONLY valid JSON with these fields:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, state or Remote",
  "salary": "salary range if mentioned, empty string if not",
  "experienceType": "Internship" or "Full-time" or "Co-op" or "Contract",
  "snippet": "a clean, well-formatted description of the role (2-3 paragraphs covering what the role does, requirements, and any perks/benefits). Write it in plain text, no markdown, no bullet points, no headers. Make it read naturally.",
  "applyUrl": "the direct apply URL if found, otherwise empty string"
}

Webpage content:
${pageText}`;

  let aiRes;
  try {
    aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
  } catch (fetchErr) {
    return NextResponse.json(
      { error: `OpenAI API connection failed: ${fetchErr}` },
      { status: 500 }
    );
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    let message = errText;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.error?.message || errText;
    } catch {}
    return NextResponse.json(
      { error: `OpenAI API error (${aiRes.status}): ${message}` },
      { status: 500 }
    );
  }

  const aiData = await aiRes.json();
  const responseText = aiData.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw: responseText },
      { status: 500 }
    );
  }

  if (!parsed.title || !parsed.company) {
    return NextResponse.json(
      { error: "Could not extract job details — the page may require JavaScript to load. Try pasting the job description manually." },
      { status: 400 }
    );
  }

  let applyUrl = parsed.applyUrl || "";
  if (!applyUrl || applyUrl.includes("linkedin.com")) {
    const found = await findCareerPageUrl(parsed.company, parsed.title, openaiKey);
    if (found) applyUrl = found;
  }
  if (!applyUrl || applyUrl.includes("linkedin.com")) {
    const q = encodeURIComponent(`${parsed.company} ${parsed.title} apply careers -site:linkedin.com -site:indeed.com`);
    applyUrl = `https://www.google.com/search?q=${q}`;
  }

  return NextResponse.json({
    success: true,
    data: {
      title: parsed.title || "",
      company: parsed.company || "",
      location: parsed.location || "",
      salary: parsed.salary || "",
      experienceType: parsed.experienceType || "Full-time",
      snippet: parsed.snippet || "",
      applyUrl,
    },
  });
}
