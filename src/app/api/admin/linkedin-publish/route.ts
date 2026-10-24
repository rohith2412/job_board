import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { LinkedInAccount } from "@/models/LinkedInAccount";
import { LinkedInPost } from "@/models/LinkedInPost";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  await connectDB();

  const post = await LinkedInPost.findById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const allAccounts = await LinkedInAccount.find({});
  const connected = allAccounts.filter((a) => new Date(a.expiresAt) > new Date());

  if (connected.length === 0) {
    return NextResponse.json(
      { error: "No connected LinkedIn accounts. Connect at least one first." },
      { status: 400 }
    );
  }

  const results: { profile: string; name: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < connected.length; i++) {
    const account = connected[i];
    const author = `urn:li:person:${account.linkedinId}`;
    const commentary = i === 0 ? post.content : post.content + "\n​";

    try {
      const publishRes = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": "202610",
        },
        body: JSON.stringify({
          author,
          commentary,
          visibility: "PUBLIC",
          distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
          },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
      });

      if (publishRes.ok) {
        results.push({ profile: account.profileKey, name: account.name, success: true });
      } else {
        const errText = await publishRes.text();
        let message = errText;
        try {
          const errJson = JSON.parse(errText);
          message = errJson.message || errJson.error || errText;
        } catch {}
        results.push({ profile: account.profileKey, name: account.name, success: false, error: message });
      }
    } catch {
      results.push({ profile: account.profileKey, name: account.name, success: false, error: "Network error" });
    }
  }

  const anySuccess = results.some((r) => r.success);
  if (anySuccess) {
    post.status = "posted";
    post.postedAt = new Date();
    await post.save();
  }

  return NextResponse.json({
    success: anySuccess,
    post: JSON.parse(JSON.stringify(post)),
    results,
  });
}
