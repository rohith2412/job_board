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

  const subscriber = await Subscriber.findOneAndDelete({ unsubscribeToken: token });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/jobs?alert=invalid", req.url));
  }

  return NextResponse.redirect(new URL("/jobs?alert=unsubscribed", req.url));
}
