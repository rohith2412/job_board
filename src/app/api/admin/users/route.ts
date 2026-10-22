import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  const sanitized = users.map((u) => ({
    email: u.email,
    name: u.name,
    image: u.image,
    region: u.region,
    hasPassword: !!u.password,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: sanitized });
}
