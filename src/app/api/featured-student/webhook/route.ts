import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import Stripe from "stripe";
import { getStripe, recordStripePurchase } from "@/lib/featured";

export async function POST(req: NextRequest) {
  await connection();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await recordStripePurchase(event.data.object);
  }

  return NextResponse.json({ received: true });
}
