import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const email = session.metadata?.email || session.customer_email;

      if (userId && email) {
        await AlertSubscription.findOneAndUpdate(
          { userId },
          {
            userId,
            email,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
          },
          { upsert: true }
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === "active" ? "active" :
                     subscription.status === "past_due" ? "past_due" : "cancelled";

      await AlertSubscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status }
      );
      break;
    }

    case "customer.subscription.deleted": {
      await AlertSubscription.findOneAndUpdate(
        { stripeSubscriptionId: (event.data.object as Stripe.Subscription).id },
        { status: "cancelled" }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
