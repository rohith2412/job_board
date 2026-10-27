import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/alerts?error=invalid", req.url));
  }

  await connectDB();

  const sub = await AlertSubscription.collection.findOneAndUpdate(
    { emailVerificationToken: token },
    { $set: { emailVerified: true }, $unset: { emailVerificationToken: 1 } }
  );

  if (!sub) {
    return NextResponse.redirect(new URL("/alerts?error=invalid", req.url));
  }

  return NextResponse.redirect(new URL("/alerts?verified=true", req.url));
}
