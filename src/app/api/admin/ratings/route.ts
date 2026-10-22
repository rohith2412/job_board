import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ProfileRating } from "@/models/ProfileRating";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const ratings = await ProfileRating.find({}).sort({ ratedAt: -1 }).lean();

  return NextResponse.json({ ratings: JSON.parse(JSON.stringify(ratings)) });
}
