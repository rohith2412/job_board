import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  await connection();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const priceId = process.env.STRIPE_PRICE_ID!;
  const price = await stripe.prices.retrieve(priceId);
  const mode = price.type === "recurring" ? "subscription" : "payment";

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode,
    success_url: `${req.nextUrl.origin}/featured/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.nextUrl.origin}/featured`,
  });

  return NextResponse.redirect(session.url!);
}
