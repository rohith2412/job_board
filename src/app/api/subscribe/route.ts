import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Subscriber } from "@/models/Subscriber";
import { Resend } from "resend";
import crypto from "crypto";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing?.verified) {
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        verified: false,
        verificationToken,
        unsubscribeToken,
      },
      { upsert: true }
    );

    const origin = new URL(req.url).origin;
    const verifyUrl = `${origin}/api/subscribe/verify?token=${verificationToken}`;

    await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Reblet <onboarding@resend.dev>",
      to: email.toLowerCase(),
      subject: "Confirm your Reblet job alerts",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111; margin: 0 0 16px;">Confirm your job alerts</h2>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 24px;">
            Click the button below to start receiving curated software engineering job alerts from Reblet.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #86efac; color: #000; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 999px; border: 2px solid #000;">
            Confirm subscription
          </a>
          <p style="font-size: 13px; color: #999; margin: 32px 0 0; line-height: 1.5;">
            If you didn't sign up for Reblet alerts, you can ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Check your email to confirm" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
