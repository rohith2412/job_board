import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";
import { SavedJob } from "@/models/SavedJob";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const subscribers = await AlertSubscription.find({ status: "active" });

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No active subscribers" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    try {
      const query: Record<string, unknown> = { featured: true };

      const keywords = sub.preferences?.keywords || [];
      const location = sub.preferences?.location || "";
      const remote = sub.preferences?.remote || false;

      if (keywords.length > 0) {
        const keywordRegex = keywords.map((k: string) => new RegExp(k, "i"));
        query.$or = [
          { title: { $in: keywordRegex } },
          { company: { $in: keywordRegex } },
          { description: { $in: keywordRegex } },
        ];
      }

      if (location) {
        query.location = { $regex: location, $options: "i" };
      }

      if (remote) {
        query.$or = [
          ...(query.$or as Array<Record<string, unknown>> || []),
          { location: { $regex: "remote", $options: "i" } },
        ];
      }

      const jobs = await SavedJob.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (jobs.length === 0) continue;

      const origin = process.env.NEXTAUTH_URL || "https://www.reblet.com";

      const jobRows = jobs
        .map(
          (job) => `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
              <a href="${origin}/jobs/${job.slug}" style="color: #111; text-decoration: none; font-weight: 600; font-size: 16px;">
                ${job.title}
              </a>
              <div style="margin-top: 4px; color: #666; font-size: 14px;">
                ${job.company}${job.location ? ` · ${job.location}` : ""}${job.salary ? ` · ${job.salary}` : ""}
              </div>
            </td>
          </tr>`
        )
        .join("");

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "Reblet <onboarding@resend.dev>",
        to: sub.email,
        subject: `Your daily job matches — ${jobs.length} new ${jobs.length === 1 ? "job" : "jobs"}`,
        html: `
          <div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="padding: 24px 0; border-bottom: 2px solid #111;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #111;">Reblet</h1>
            </div>
            <div style="padding: 24px 0;">
              <p style="margin: 0 0 8px; color: #111; font-size: 16px; font-weight: 600;">
                Your daily job matches
              </p>
              <p style="margin: 0 0 24px; color: #666; font-size: 14px;">
                ${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} matching your preferences
              </p>
              <table style="width: 100%; border-collapse: collapse;">
                ${jobRows}
              </table>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${origin}/jobs" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  View all jobs
                </a>
              </div>
            </div>
            <div style="padding: 24px 0; border-top: 1px solid #eee; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                <a href="${origin}/alerts" style="color: #999;">Manage preferences</a>
              </p>
            </div>
          </div>
        `,
      });

      await AlertSubscription.updateOne(
        { _id: sub._id },
        { $set: { lastSentAt: new Date() } }
      );

      sent++;
    } catch (err) {
      errors.push(`${sub.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ sent, total: subscribers.length, errors });
}
