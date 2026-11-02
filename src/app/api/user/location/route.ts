import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = req.headers.get("x-vercel-ip-city");
  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");

  if (!city && !country) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await connectDB();
  await User.updateOne(
    { email: session.user.email },
    {
      lastLoginCity: city ? decodeURIComponent(city) : "",
      lastLoginCountry: country || "",
      lastLoginRegion: region || "",
    }
  );

  return NextResponse.json({ ok: true });
}
