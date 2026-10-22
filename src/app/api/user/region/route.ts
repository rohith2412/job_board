import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ region: null }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).lean();
  return NextResponse.json({ region: user?.region || "" });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { region } = await req.json();
  if (!region || typeof region !== "string") {
    return NextResponse.json({ error: "Region is required" }, { status: 400 });
  }

  await connectDB();
  await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: { region } }
  );

  return NextResponse.json({ region });
}
