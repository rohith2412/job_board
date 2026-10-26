import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
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

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Reblet Premium Job Alerts",
            description: "Daily personalized SWE job alerts delivered to your inbox",
          },
          unit_amount: 499,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email,
    metadata: {
      userId: session.user.id,
      email: session.user.email,
    },
    success_url: `${origin}/alerts?success=true`,
    cancel_url: `${origin}/alerts?cancelled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
