import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileKey = req.nextUrl.searchParams.get("profile");
  if (!profileKey || !["company", "personal1", "personal2"].includes(profileKey)) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "LinkedIn Client ID not configured" }, { status: 500 });
  }

  const redirectUri = `${req.nextUrl.origin}/api/admin/linkedin-callback`;
  const state = profileKey;
  const scope = "openid profile w_member_social";

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(authUrl);
}
