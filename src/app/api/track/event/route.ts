import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { cleanId, cleanText, isBot } from "@/lib/user-agent";

const OWNER_EMAILS = ["rohithra75@gmail.com", "rohithdevswe@gmail.com"];

export async function POST(req: NextRequest) {
  try {
    if (isBot(req.headers.get("user-agent") || "")) return NextResponse.json({ ok: true });
    const body = JSON.parse(await req.text());
    if (body.type !== "apply_click") return NextResponse.json({ ok: false }, { status: 400 });

    const path = cleanText(body.path, 300) || "/";
    const jobSlug = path.match(/^\/jobs\/([^/?#]+)/)?.[1];
    let targetHost: string | undefined;
    try {
      targetHost = new URL(String(body.href)).hostname.replace(/^www\./, "");
    } catch {}

    await connectDB();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    await AnalyticsEvent.create({
      type: "apply_click",
      path,
      jobSlug,
      targetHost,
      visitorId: cleanId(body.visitorId),
      sessionId: cleanId(body.sessionId),
      userEmail: email || undefined,
      country: req.headers.get("x-vercel-ip-country") || undefined,
      // Only clicks from real input count; a scripted click() arrives with human false.
      human: body.human === true,
      ...(body.internal === true || (email && OWNER_EMAILS.includes(email)) ? { internal: true } : {}),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
