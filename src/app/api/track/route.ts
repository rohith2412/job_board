import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";
import { maybePublishDuePosts } from "@/lib/linkedin";

const BOT_PATTERNS = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|baiduspider|yandex|duckduckbot|googlebot|bingbot|mj12bot|ahrefsbot|semrushbot|dotbot|rogerbot|screaming|headless|phantomjs|puppet|selenium|webdriver|python-requests|axios|node-fetch|go-http-client|java\/|curl|wget|scrapy|httpclient|applebot|petalbot|bytespider|gptbot|claudebot|anthropic|ccbot/i;

function isBot(ua: string): boolean {
  if (!ua || ua.length < 20) return true;
  return BOT_PATTERNS.test(ua);
}

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();

    const userAgent = req.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    after(() => maybePublishDuePosts().catch((err) => console.error("Scheduled post check failed:", err)));

    await connectDB();

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";

    let country = "";
    let city = "";
    let region = "";

    const geoCountry = req.headers.get("x-vercel-ip-country");
    const geoCity = req.headers.get("x-vercel-ip-city");
    const geoRegion = req.headers.get("x-vercel-ip-country-region");

    if (geoCountry) country = geoCountry;
    if (geoCity) city = decodeURIComponent(geoCity);
    if (geoRegion) region = geoRegion;

    const session = await getServerSession(authOptions);

    const visitData: Record<string, unknown> = {
      path: path || "/",
      country,
      city,
      region,
      ip,
      userAgent,
    };

    if (session?.user?.email) {
      visitData.userEmail = session.user.email;
      visitData.userName = session.user.name || "";
      visitData.userId = (session.user as { id?: string }).id || "";
    }

    await Visit.create(visitData);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
