import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Company } from "@/models/Company";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const company = await Company.findOne({ userEmail: session.user.email }).lean();
  return NextResponse.json({ company: company ? JSON.parse(JSON.stringify(company)) : null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, logo, description, location, website } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  await connectDB();
  const company = await Company.findOneAndUpdate(
    { userEmail: session.user.email },
    {
      name: name.trim(),
      logo: logo || "",
      description: description?.trim() || "",
      location: location?.trim() || "",
      website: website?.trim() || "",
      userEmail: session.user.email,
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({ company: JSON.parse(JSON.stringify(company)) });
}
