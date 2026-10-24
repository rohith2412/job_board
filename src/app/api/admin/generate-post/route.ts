import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const jobs = await SavedJob.find({ featured: true })
    .sort({ createdAt: -1 })
    .limit(30)
    .select("title slug company location createdAt")
    .lean();

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      slug: j.slug,
      title: j.title,
      company: j.company,
      location: j.location,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const { count = 5, audience = "US", slugs } = await req.json().catch(() => ({}));

  await connectDB();

  let jobs;
  if (Array.isArray(slugs) && slugs.length > 0) {
    jobs = await SavedJob.find({ slug: { $in: slugs } }).lean();
  } else {
    jobs = await SavedJob.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(count)
      .lean();
  }

  if (jobs.length === 0) {
    return NextResponse.json({ error: "No jobs found" }, { status: 404 });
  }

  const jobList = jobs
    .map(
      (j, i) =>
        `${i + 1}. ${j.title} — https://reblet.com/jobs/${j.slug}`
    )
    .join("\n");

  const prompt = `Generate a LinkedIn post for a software engineering job board called Reblet. The post should highlight these ${jobs.length} new job openings and drive traffic to reblet.com.

Target audience: Software engineering interns and new grads in the ${audience}.

Jobs to include (use only the role title, NOT the company name):
${jobList}

Requirements:
- Start with an attention-grabbing headline using emojis
- List each job with its reblet.com link as plain text (NOT markdown links)
- Add a call to action to apply
- Add a share reminder
- End with "Browse all jobs → https://reblet.com/jobs"
- Add relevant hashtags at the end
- IMPORTANT: Keep the TOTAL post under 2800 characters (LinkedIn cuts off at 3000)
- Keep it concise and high-energy
- Focus on ${audience} audience
- Do NOT include company names, only role titles
- Do NOT use any markdown formatting (no **, no [], no () links). Write plain text only — LinkedIn does not render markdown.
- Links should be on their own line as plain URLs

Return ONLY the post text, nothing else.`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

  if (!aiRes.ok) {
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }

  const data = await aiRes.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jobSlugs = jobs.map((j) => j.slug);

  return NextResponse.json({ content, jobSlugs });
}
