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

  const account = await LinkedInAccount.findOne({ profileKey: post.profile });
  if (!account) {
    return NextResponse.json(
      { error: `No LinkedIn account connected for ${post.profile}. Connect it first.` },
      { status: 400 }
    );
  }

  if (new Date(account.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "LinkedIn token expired. Please reconnect the account." },
      { status: 401 }
    );
  }

  const publishRes = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify({
      author: `urn:li:person:${account.linkedinId}`,
      commentary: post.content,
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

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    let message = errText;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.message || errJson.error || errText;
    } catch {}
    return NextResponse.json(
      { error: `LinkedIn API error: ${message}` },
      { status: publishRes.status }
    );
  }

  post.status = "posted";
  post.postedAt = new Date();
  await post.save();

  return NextResponse.json({
    success: true,
    post: JSON.parse(JSON.stringify(post)),
  });
}
