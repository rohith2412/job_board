import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keywords = "" } = body;

  const params = new URLSearchParams({ limit: "20" });
  if (keywords) params.set("query", keywords);

  const response = await fetch(
    `https://himalayas.app/jobs/api?${params}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch jobs from Himalayas" },
      { status: response.status }
    );
  }

  const data = await response.json();
  const jobs = (data.jobs || []).map(
    (job: Record<string, string | string[]>) => ({
      title: job.title,
      company: job.companyName,
      location: Array.isArray(job.categories)
        ? (job.categories as string[]).join(", ")
        : job.locationRestrictions || "Remote",
      snippet: typeof job.excerpt === "string" ? job.excerpt : "",
      link: job.applicationLink || job.url || "",
      salary:
        job.minSalary && job.maxSalary
          ? `$${job.minSalary} - $${job.maxSalary}`
          : "",
      source: "Himalayas",
    })
  );

  return NextResponse.json({ jobs, totalCount: data.totalCount || 0 });
}
