import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Subscriber } from "@/models/Subscriber";
import { User } from "@/models/User";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/jobs?alert=invalid", req.url));
  }

  await connectDB();

  const subscriber = await Subscriber.findOneAndDelete({ unsubscribeToken: token });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/jobs?alert=invalid", req.url));
  }

  return NextResponse.redirect(new URL("/jobs?alert=unsubscribed", req.url));
}

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await connectDB();

  const result = await User.updateOne(
    { unsubscribeToken: token },
    { emailConsent: false }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
