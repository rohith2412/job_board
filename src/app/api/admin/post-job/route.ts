import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

const ADMIN_EMAIL = "rohithra75@gmail.com";

function generateSlug(title: string, company: string): string {
  const base = `${title} at ${company}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rawText, applyLink } = await req.json();
  if (!rawText || !applyLink) {
    return NextResponse.json(
      { error: "Job description and apply link are required" },
      { status: 400 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const prompt = `Extract job details from this posting and return ONLY valid JSON with these fields:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, state or Remote",
  "salary": "salary range if mentioned, empty string if not",
  "experienceType": "Internship" or "Full-time" or "Co-op" or "Contract",
  "snippet": "a clean, well-formatted description of the role (2-3 paragraphs covering what the role does, requirements, and any perks/benefits). Write it in plain text, no markdown, no bullet points, no headers. Make it read naturally."
}

Job posting:
${rawText}`;

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
    console.error("OpenAI API fetch error:", fetchErr);
    return NextResponse.json(
      { error: `OpenAI API connection failed: ${fetchErr}` },
      { status: 500 }
    );
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("OpenAI API error:", aiRes.status, errText);
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
  const responseText =
    aiData.choices?.[0]?.message?.content || "";

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

  const slug = generateSlug(parsed.title, parsed.company);

  await connectDB();

  const existing = await SavedJob.findOne({
    $or: [{ slug }, { link: applyLink }],
  });
  if (existing) {
    return NextResponse.json(
      { error: "Job already exists", slug: existing.slug },
      { status: 409 }
    );
  }

  const job = await SavedJob.create({
    slug,
    title: parsed.title,
    company: parsed.company,
    location: parsed.location || "",
    salary: parsed.salary || "",
    snippet: parsed.snippet || "",
    link: applyLink,
    source: "admin",
    featured: true,
    experienceType: parsed.experienceType || "Full-time",
  });

  return NextResponse.json({
    success: true,
    job: {
      slug: job.slug,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      experienceType: job.experienceType,
    },
  });
}
