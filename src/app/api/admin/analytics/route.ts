import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildAnalytics } from "@/lib/analytics";

const ADMIN_EMAIL = "rohithra75@gmail.com";
const RANGES = new Set([1, 7, 30, 90, 365]);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requested = Number(req.nextUrl.searchParams.get("range"));
  const range = RANGES.has(requested) ? requested : 30;
  return NextResponse.json(await buildAnalytics(range), { headers: { "Cache-Control": "no-store" } });
}
