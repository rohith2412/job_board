import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";
import { maybePublishDuePosts } from "@/lib/linkedin";
import { cleanId, cleanText, isBot, parseUserAgent } from "@/lib/user-agent";

const OWNER_EMAILS = ["rohithra75@gmail.com", "rohithdevswe@gmail.com"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userAgent = req.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true });
    }

    after(() => maybePublishDuePosts().catch((err) => console.error("Scheduled post check failed:", err)));

    await connectDB();

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";

    const geoCity = req.headers.get("x-vercel-ip-city");
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    const visit = await Visit.create({
      path: cleanText(body.path, 300) || "/",
      country: req.headers.get("x-vercel-ip-country") || "",
      city: geoCity ? decodeURIComponent(geoCity) : "",
      region: req.headers.get("x-vercel-ip-country-region") || "",
      ip,
      userAgent,
      ...parseUserAgent(userAgent),
      visitorId: cleanId(body.visitorId),
      sessionId: cleanId(body.sessionId),
      referrerHost: cleanText(body.referrerHost, 100)?.toLowerCase(),
      utmSource: cleanText(body.utmSource, 80)?.toLowerCase(),
      utmMedium: cleanText(body.utmMedium, 80)?.toLowerCase(),
      utmCampaign: cleanText(body.utmCampaign, 120),
      language: cleanText(body.language, 20),
      timezone: cleanText(body.timezone, 60),
      ...(body.internal === true || (email && OWNER_EMAILS.includes(email)) ? { internal: true } : {}),
      ...(email
        ? {
            userEmail: email,
            userName: session?.user?.name || "",
            userId: (session?.user as { id?: string }).id || "",
          }
        : {}),
    });

    return NextResponse.json({ ok: true, id: String(visit._id) });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
