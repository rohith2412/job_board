import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findActiveFeatured, successPath } from "@/lib/featured";

export type FeaturedStatus =
  | { status: "none" }
  | { status: "draft" | "live"; href: string; expiresAt: string };

export async function GET() {
  await connection();

  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const record = await findActiveFeatured(email);
  const body: FeaturedStatus =
    record?.stripeSessionId && record.expiresAt
      ? {
          status: record.headline ? "live" : "draft",
          href: successPath(record.stripeSessionId),
          expiresAt: record.expiresAt.toISOString(),
        }
      : { status: "none" };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
