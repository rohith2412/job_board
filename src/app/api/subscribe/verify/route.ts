import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Subscriber } from "@/models/Subscriber";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/jobs?alert=invalid", req.url));
  }

  await connectDB();

  const subscriber = await Subscriber.findOneAndUpdate(
    { verificationToken: token },
    { verified: true, verificationToken: null },
    { new: true }
  );

  if (!subscriber) {
    return NextResponse.redirect(new URL("/jobs?alert=invalid", req.url));
  }

  return NextResponse.redirect(new URL("/jobs?alert=confirmed", req.url));
}
