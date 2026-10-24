import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Application } from "@/models/Application";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ applied: false });
  }

  const jobSlug = req.nextUrl.searchParams.get("slug");
  if (!jobSlug) {
    return NextResponse.json({ applied: false });
  }

  await connectDB();

  const existing = await Application.findOne({
    jobSlug,
    applicantEmail: session.user.email,
  }).lean();

  return NextResponse.json({ applied: !!existing });
}
