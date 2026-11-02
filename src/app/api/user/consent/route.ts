import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let consented = true;
  try {
    const body = await req.json();
    if (typeof body.consented === "boolean") consented = body.consented;
  } catch {
    // no body = default to true (backwards compatible with welcome page)
  }

  await connectDB();
  await User.updateOne(
    { email: session.user.email },
    { emailConsent: consented }
  );

  return NextResponse.json({ ok: true, consented });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email })
    .select("emailConsent")
    .lean();

  return NextResponse.json({ consented: !!(user as any)?.emailConsent });
}
