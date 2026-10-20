import { NextRequest, NextResponse } from "next/server";

const USAJOBS_API_KEY = process.env.USAJOBS_API_KEY!;
const USAJOBS_EMAIL = process.env.USAJOBS_EMAIL!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { keywords = "", location = "", page = 1 } = body;

  const params = new URLSearchParams({
    Keyword: keywords,
    LocationName: location,
    Page: String(page),
    ResultsPerPage: "20",
  });

  const response = await fetch(
    `https://data.usajobs.gov/api/search?${params}`,
    {
      headers: {
        "Authorization-Key": USAJOBS_API_KEY,
        "User-Agent": USAJOBS_EMAIL,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch jobs from USAJOBS" },
      { status: response.status }
    );
  }

  const data = await response.json();
  const jobs = (data.SearchResult?.SearchResultItems || []).map(
    (item: Record<string, Record<string, string>>) => {
      const pos = item.MatchedObjectDescriptor;
      return {
        title: pos.PositionTitle,
        company: pos.OrganizationName,
        location: pos.PositionLocationDisplay,
        snippet: pos.QualificationSummary?.slice(0, 200) || "",
        link: pos.PositionURI,
        salary: pos.PositionRemuneration
          ? `${(pos.PositionRemuneration as unknown as Array<{ MinimumRange: string; MaximumRange: string }>)[0]?.MinimumRange} - ${(pos.PositionRemuneration as unknown as Array<{ MinimumRange: string; MaximumRange: string }>)[0]?.MaximumRange}`
          : "",
        source: "USAJOBS",
      };
    }
  );

  return NextResponse.json({ jobs, totalCount: data.SearchResult?.SearchResultCount || 0 });
}
