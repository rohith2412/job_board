import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { FeaturedStudent } from "@/models/FeaturedStudent";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.json();
  const { sessionId, name, email, school, gradYear, headline, skills, github, linkedin, resume, portfolio, links } = body;

  if (!sessionId || !name || !email || !school || !gradYear || !headline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
  }

  await connectDB();

  const existing = await FeaturedStudent.findOne({ stripeSessionId: sessionId });
  if (existing) {
    return NextResponse.json({ error: "Profile already created for this payment" }, { status: 409 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await FeaturedStudent.create({
    email,
    name,
    school,
    gradYear,
    headline,
    skills: skills || [],
    github: github || "",
    linkedin: linkedin || "",
    resume: resume || "",
    portfolio: portfolio || "",
    links: links || [],
    active: true,
    stripeSessionId: sessionId,
    paidAt: now,
    expiresAt,
  });

  return NextResponse.json({ ok: true });
}
