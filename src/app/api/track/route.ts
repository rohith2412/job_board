import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Visit } from "@/models/Visit";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    await connectDB();

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";

    let country = "";
    let city = "";
    let region = "";

    const geoCountry = req.headers.get("x-vercel-ip-country");
    const geoCity = req.headers.get("x-vercel-ip-city");
    const geoRegion = req.headers.get("x-vercel-ip-country-region");

    if (geoCountry) country = geoCountry;
    if (geoCity) city = decodeURIComponent(geoCity);
    if (geoRegion) region = geoRegion;

    await Visit.create({
      path: path || "/",
      country,
      city,
      region,
      ip,
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
