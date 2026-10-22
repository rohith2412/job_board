import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { ProfileRating } from "@/models/ProfileRating";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Rating ID is required" }, { status: 400 });
  }

  await connectDB();
  const rating = await ProfileRating.findByIdAndDelete(id);
  if (!rating) {
    return NextResponse.json({ error: "Rating not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
