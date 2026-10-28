import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  await connectDB();

  const existing = await AlertSubscription.findOne({
    userId: session.user.id,
    status: "active",
  });
  if (existing) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  let plan = "monthly";
  try {
    const body = await req.json();
    if (body.plan === "yearly") plan = "yearly";
  } catch {}

  const isYearly = plan === "yearly";

  const userEmail = session.user.email || "";

  if (process.env.BYPASS_STRIPE === "true") {
    await AlertSubscription.findOneAndUpdate(
      { userId: session.user.id },
      {
        userId: session.user.id,
        ...(userEmail && { email: userEmail }),
        status: "active",
        stripeCustomerId: "bypass_free",
        stripeSubscriptionId: "bypass_free",
      },
      { upsert: true }
    );
    return NextResponse.json({ url: `${origin}/alerts?success=true` });
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Reblet Premium Job Alerts",
            description: `Daily personalized SWE job alerts - ${isYearly ? "yearly" : "monthly"} plan`,
          },
          unit_amount: isYearly ? 2499 : 399,
          recurring: { interval: isYearly ? "year" : "month" },
        },
        quantity: 1,
      },
    ],
    ...(userEmail && { customer_email: userEmail }),
    metadata: {
      userId: session.user.id,
      ...(userEmail && { email: userEmail }),
    },
    success_url: `${origin}/alerts?success=true`,
    cancel_url: `${origin}/alerts?cancelled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
