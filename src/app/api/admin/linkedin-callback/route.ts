import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { LinkedInAccount } from "@/models/LinkedInAccount";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const profileKey = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !profileKey) {
    return NextResponse.redirect(new URL("/admin?linkedin=error", req.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/admin?linkedin=error", req.url));
  }

  const redirectUri = `${req.nextUrl.origin}/api/admin/linkedin-callback`;

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/admin?linkedin=error", req.url));
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in || 5184000;
  const refreshToken = tokenData.refresh_token;

  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(new URL("/admin?linkedin=error", req.url));
  }

  const profileData = await profileRes.json();
  const linkedinId = profileData.sub;
  const name = profileData.name || profileData.email || "LinkedIn User";

  await connectDB();
  await LinkedInAccount.findOneAndUpdate(
    { profileKey },
    {
      profileKey,
      linkedinId,
      name,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    },
    { upsert: true, new: true }
  );

  return NextResponse.redirect(new URL(`/admin/content?linkedin=connected&profile=${profileKey}`, req.url));
}
