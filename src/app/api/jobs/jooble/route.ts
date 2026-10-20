import { NextRequest, NextResponse } from "next/server";

const JOOBLE_URL = "https://ca.jooble.org/api/";
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keywords = "", location = "", page = 1 } = body;

  const response = await fetch(JOOBLE_URL + JOOBLE_API_KEY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, location, page }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch jobs from Jooble" },
      { status: response.status }
    );
  }

  const data = await response.json();
  const jobs = (data.jobs || []).map(
    (job: Record<string, string>) => ({
      ...job,
      source: "Jooble",
    })
  );

  return NextResponse.json({ jobs, totalCount: data.totalCount || 0 });
}
