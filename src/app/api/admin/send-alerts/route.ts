import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { SavedJob } from "@/models/SavedJob";
import { Resend } from "resend";
import crypto from "crypto";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const users = await User.find({ emailConsent: true })
    .select("email name unsubscribeToken")
    .lean();

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, message: "No consented users" });
  }

  const jobs = await SavedJob.find({ featured: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  if (jobs.length === 0) {
    return NextResponse.json({ sent: 0, total: users.length, message: "No jobs to send" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const origin = process.env.NEXTAUTH_URL || "https://www.reblet.com";
  const fromAddress = process.env.EMAIL_FROM || "Reblet <onboarding@resend.dev>";

  const jobRows = jobs
    .map(
      (job) => `
      <tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f3f4f6;">
          <a href="${origin}/jobs/${job.slug}" style="color: #111827; text-decoration: none; font-weight: 600; font-size: 15px; line-height: 1.4;">
            ${job.title}
          </a>
          <div style="margin-top: 4px; color: #6b7280; font-size: 13px; line-height: 1.4;">
            ${job.company}${job.location ? ` &middot; ${job.location}` : ""}${job.salary ? ` &middot; ${job.salary}` : ""}
          </div>
        </td>
      </tr>`
    )
    .join("");

  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      const u = user as { _id: string; email: string; name?: string; unsubscribeToken?: string };
      const firstName = u.name?.split(" ")[0] || "";

      let token = u.unsubscribeToken;
      if (!token) {
        token = crypto.randomBytes(32).toString("hex");
        await User.updateOne({ _id: u._id }, { unsubscribeToken: token });
      }

      const unsubscribeUrl = `${origin}/unsubscribe?token=${token}`;

      await resend.emails.send({
        from: fromAddress,
        to: u.email,
        subject: `${jobs.length} new SWE jobs on Reblet`,
        html: `
          <div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff;">
            <div style="padding: 24px 0; border-bottom: 2px solid #111827;">
              <a href="${origin}" style="text-decoration: none;">
                <img src="${origin}/favicon.png" alt="Reblet" width="36" height="36" style="display: block; border-radius: 8px;" />
              </a>
            </div>
            <div style="padding: 24px 0;">
              <p style="margin: 0 0 6px; color: #111827; font-size: 16px; font-weight: 600;">
                ${firstName ? `Hey ${firstName}, here are` : "Here are"} today's top jobs
              </p>
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                Fresh SWE internship and new grad roles just posted.
              </p>
              <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 12px;">
                ${jobRows}
              </table>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${origin}/jobs" style="display: inline-block; padding: 12px 28px; background: #86efac; color: #000; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 600; border: 2px solid #000;">
                  Browse all jobs
                </a>
              </div>
            </div>
            <div style="padding: 20px 0; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                You're receiving this because you signed up on <a href="${origin}" style="color: #9ca3af;">reblet.com</a>.<br>
                <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
      });

      sent++;
      if (sent < users.length) await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      const email = (user as { email: string }).email;
      errors.push(`${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ sent, total: users.length, errors });
}
