import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await connectDB();

  const sub = await AlertSubscription.findOne({
    userId: session.user.id,
    status: "active",
  });

  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  if (process.env.BYPASS_EMAIL === "true") {
    await AlertSubscription.collection.updateOne(
      { userId: session.user.id },
      { $set: { email, emailVerified: true } }
    );
    return NextResponse.json({ verified: true, message: "Email verified (dev mode)." });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await AlertSubscription.collection.updateOne(
    { userId: session.user.id },
    { $set: { email, emailVerified: false, emailVerificationToken: token } }
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const origin = process.env.NEXTAUTH_URL || "https://www.reblet.com";
  const { error: sendError } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Reblet <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email for Reblet Job Alerts",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px;">
        <h2 style="font-size: 18px; color: #111;">Verify your email</h2>
        <p style="color: #555; font-size: 14px;">Click the button below to confirm this email for your Reblet job alerts.</p>
        <a href="${origin}/api/alerts/verify-email?token=${token}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #111; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Verify email</a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn&apos;t request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (sendError) {
    return NextResponse.json(
      { error: "Failed to send email. Without a verified domain, Resend can only send to your account email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Verification email sent! Check your inbox." });
}
