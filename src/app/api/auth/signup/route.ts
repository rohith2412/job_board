import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  await connectDB();

  const hashed = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.password) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    existing.password = hashed;
    if (name) existing.name = name;
    await existing.save();
  } else {
    await User.create({
      name,
      email,
      password: hashed,
      image: "",
    });
  }

  return NextResponse.json({ success: true });
}
