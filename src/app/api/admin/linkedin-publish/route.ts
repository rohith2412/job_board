import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publishPost } from "@/lib/linkedin";

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

  const outcome = await publishPost(postId, ["draft", "scheduled", "failed"]);
  if (!outcome.claimed) {
    return NextResponse.json(
      { error: "Post not found, already posted, or currently publishing" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: outcome.post.status === "posted",
    post: JSON.parse(JSON.stringify(outcome.post)),
    results: outcome.results,
  });
}
