import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ADMIN_EMAIL,
  FEATURED_PRODUCT,
  findActiveFeatured,
  getStripe,
  grantAdminFeatured,
  successPath,
} from "@/lib/featured";

export async function GET(req: NextRequest) {
  await connection();
  const origin = req.nextUrl.origin;
  const to = (path: string) => NextResponse.redirect(new URL(path, origin));

  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (!email) {
    return to(`/login?callbackUrl=${encodeURIComponent("/featured")}`);
  }

  const active = await findActiveFeatured(email);
  if (active?.stripeSessionId) return to(successPath(active.stripeSessionId));

  if (email === ADMIN_EMAIL) {
    const record = await grantAdminFeatured({ email, name: authSession?.user?.name });
    if (!record?.stripeSessionId) return to("/featured?error=checkout");
    return to(successPath(record.stripeSessionId));
  }

  try {
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID!;
    const price = await stripe.prices.retrieve(priceId);

    const checkout = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: price.type === "recurring" ? "subscription" : "payment",
      customer_email: email,
      metadata: { product: FEATURED_PRODUCT, userEmail: email },
      success_url: `${origin}/featured/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/featured`,
    });
    if (!checkout.url) throw new Error("Stripe returned no checkout URL");
    return NextResponse.redirect(checkout.url, 303);
  } catch (err) {
    console.error("Featured checkout failed:", err);
    return to("/featured?error=checkout");
  }
}
