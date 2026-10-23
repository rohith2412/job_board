import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { LinkedInAccount } from "@/models/LinkedInAccount";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const accounts = await LinkedInAccount.find({}).lean();

  const safe = accounts.map((a) => ({
    profileKey: a.profileKey,
    name: a.name,
    connected: new Date(a.expiresAt) > new Date(),
    expiresAt: a.expiresAt,
  }));

  return NextResponse.json({ accounts: safe });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileKey } = await req.json();
  if (!profileKey) {
    return NextResponse.json({ error: "Profile key required" }, { status: 400 });
  }

  await connectDB();
  await LinkedInAccount.findOneAndDelete({ profileKey });

  return NextResponse.json({ success: true });
}
