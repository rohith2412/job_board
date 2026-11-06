import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { FeaturedStudent } from "@/models/FeaturedStudent";

export const ADMIN_EMAIL = "rohithra75@gmail.com";

// Distinguishes featured checkouts from alerts checkouts, which share the Stripe account and webhook.
export const FEATURED_PRODUCT = "featured_student";

const FEATURED_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type Owner = { email: string; name?: string | null };

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export function successPath(sessionId: string) {
  return `/featured/success?session_id=${encodeURIComponent(sessionId)}`;
}

export async function findActiveFeatured(email: string) {
  await connectDB();
  return FeaturedStudent.findOne({
    email,
    active: true,
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: -1 });
}

async function upsertPurchase(stripeSessionId: string, owner: Owner, paidAt: Date) {
  await connectDB();
  const doc = {
    email: owner.email,
    name: owner.name || owner.email,
    active: true,
    stripeSessionId,
    paidAt,
    expiresAt: new Date(paidAt.getTime() + FEATURED_DURATION_MS),
  };
  try {
    return await FeaturedStudent.findOneAndUpdate(
      { stripeSessionId },
      { $setOnInsert: doc },
      { upsert: true, returnDocument: "after" }
    );
  } catch (err) {
    // The success page and the webhook can record the same payment concurrently.
    if ((err as { code?: number }).code === 11000) {
      return FeaturedStudent.findOne({ stripeSessionId });
    }
    throw err;
  }
}

export function grantAdminFeatured(owner: Owner) {
  return upsertPurchase(`admin-bypass-${Date.now()}`, owner, new Date());
}

export async function recordStripePurchase(session: Stripe.Checkout.Session, name?: string | null) {
  const email = session.metadata?.userEmail;
  if (session.metadata?.product !== FEATURED_PRODUCT || !email) return null;
  if (session.payment_status !== "paid") return null;
  return upsertPurchase(
    session.id,
    { email, name: name || session.customer_details?.name },
    new Date(session.created * 1000)
  );
}

// Returns the purchase behind `sessionId` only if it belongs to `owner`, recording a verified Stripe payment on first sight.
export async function claimPurchase(sessionId: string, owner: Owner) {
  await connectDB();
  const existing = await FeaturedStudent.findOne({ stripeSessionId: sessionId });
  if (existing) return existing.email === owner.email ? existing : null;

  if (!sessionId.startsWith("cs_")) return null;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
  if (session.metadata?.userEmail !== owner.email) return null;
  return recordStripePurchase(session, owner.name);
}
