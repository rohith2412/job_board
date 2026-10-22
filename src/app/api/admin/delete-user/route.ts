import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ProfileRating } from "@/models/ProfileRating";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (email === ADMIN_EMAIL) {
    return NextResponse.json({ error: "Cannot delete admin account" }, { status: 403 });
  }

  await connectDB();

  const user = await User.findOneAndDelete({ email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await ProfileRating.deleteMany({ userEmail: email });

  return NextResponse.json({ success: true, deleted: email });
}
