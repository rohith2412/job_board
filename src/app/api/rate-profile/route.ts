import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ProfileRating } from "@/models/ProfileRating";

const RATE_LIMIT_DAYS = 7;

interface GitHubUser {
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
  created_at: string;
}

async function fetchGitHubStats(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data: GitHubUser = await res.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=stargazers_count`,
      { headers: { Accept: "application/vnd.github.v3+json" } }
    );
    const repos = reposRes.ok ? await reposRes.json() : [];

    const totalStars = repos.reduce(
      (sum: number, r: any) => sum + (r.stargazers_count || 0),
      0
    );
    const languages = [
      ...new Set(repos.map((r: any) => r.language).filter(Boolean)),
    ];
    const forkedCount = repos.filter((r: any) => r.fork).length;

    return {
      repos: data.public_repos,
      followers: data.followers,
      bio: data.bio,
      totalStars,
      languages: languages.slice(0, 10),
      originalRepos: data.public_repos - forkedCount,
      accountAge: Math.floor(
        (Date.now() - new Date(data.created_at).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      ),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to rate your profile" }, { status: 401 });
  }

  await connectDB();
  const latest = await ProfileRating.findOne({ userEmail: session.user.email })
    .sort({ ratedAt: -1 })
    .lean();

  if (!latest) {
    return NextResponse.json({ rating: null });
  }

  const msUntilNext =
    new Date(latest.ratedAt).getTime() + RATE_LIMIT_DAYS * 86400000 - Date.now();

  return NextResponse.json({
    rating: {
      score: latest.score,
      grade: latest.grade,
      summary: latest.summary,
      strengths: latest.strengths,
      improvements: latest.improvements,
      tip: latest.tip,
    },
    links: {
      github: latest.github || "",
      linkedin: latest.linkedin || "",
      otherLinks: (latest as any).otherLinks || [],
      bio: latest.bio || "",
    },
    ratedAt: latest.ratedAt,
    canRateAgain: msUntilNext <= 0,
    nextRateDate: msUntilNext > 0 ? new Date(Date.now() + msUntilNext).toISOString() : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to rate your profile" }, { status: 401 });
  }

  await connectDB();

  const latest = await ProfileRating.findOne({ userEmail: session.user.email })
    .sort({ ratedAt: -1 })
    .lean();

  if (latest) {
    const msSince = Date.now() - new Date(latest.ratedAt).getTime();
    const msLimit = RATE_LIMIT_DAYS * 86400000;
    if (msSince < msLimit) {
      const daysLeft = Math.ceil((msLimit - msSince) / 86400000);
      return NextResponse.json(
        { error: `You can rate again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` },
        { status: 429 }
      );
    }
  }

  const { github, linkedin, otherLinks, bio } = await req.json();
  const filteredLinks: string[] = (otherLinks || []).filter((l: string) => l.trim());

  if (!github && !linkedin && !filteredLinks.length) {
    return NextResponse.json(
      { error: "Please provide at least one link" },
      { status: 400 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 500 }
    );
  }

  let githubStats = null;
  if (github) {
    const match = github.match(/github\.com\/([^/?#]+)/);
    if (match) {
      githubStats = await fetchGitHubStats(match[1]);
    }
  }

  const prompt = `You are a tech career advisor rating a software engineering candidate's online presence. Rate them out of 100 and give actionable feedback.

Here's what they provided:
${github ? `- GitHub: ${github}` : "- GitHub: not provided"}
${linkedin ? `- LinkedIn: ${linkedin}` : "- LinkedIn: not provided"}
${filteredLinks.length ? filteredLinks.map((l: string) => `- Link: ${l}`).join("\n") : "- Other links: none provided"}
${bio ? `- About themselves: ${bio}` : ""}

${
  githubStats
    ? `GitHub stats:
- Public repos: ${githubStats.repos} (${githubStats.originalRepos} original)
- Total stars: ${githubStats.totalStars}
- Followers: ${githubStats.followers}
- Languages: ${githubStats.languages.join(", ")}
- Account age: ${githubStats.accountAge} years
- Bio: ${githubStats.bio || "none"}`
    : ""
}

Return ONLY valid JSON:
{
  "score": <number 1-100>,
  "grade": "<letter grade like A+, A, B+, B, etc>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<specific actionable improvement 1>", "<specific actionable improvement 2>", "<specific actionable improvement 3>"],
  "tip": "<one standout career tip personalized to this profile>"
}`;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "AI rating failed" },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices[0].message.content.trim();
    const json = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const rating = JSON.parse(json);

    await ProfileRating.create({
      userEmail: session.user.email,
      github: github || undefined,
      linkedin: linkedin || undefined,
      otherLinks: filteredLinks.length ? filteredLinks : undefined,
      bio: bio || undefined,
      score: rating.score,
      grade: rating.grade,
      summary: rating.summary,
      strengths: rating.strengths,
      improvements: rating.improvements,
      tip: rating.tip,
    });

    return NextResponse.json({ rating, githubStats });
  } catch (e) {
    console.error("Rate profile error:", e);
    return NextResponse.json(
      { error: "Failed to generate rating" },
      { status: 500 }
    );
  }
}
