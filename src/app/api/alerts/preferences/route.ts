import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/models/AlertSubscription";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  await connectDB();
  const sub = await AlertSubscription.findOne({ userId: session.user.id }).lean();

  if (!sub) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({
    subscription: {
      status: (sub as any).status,
      preferences: (sub as any).preferences,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { keywords, location, remote } = await req.json();

  await connectDB();

  const sub = await AlertSubscription.findOne({
    userId: session.user.id,
    status: "active",
  });

  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  await AlertSubscription.findOneAndUpdate(
    { userId: session.user.id },
    {
      preferences: {
        keywords: (keywords || "").split(",").map((k: string) => k.trim()).filter(Boolean),
        location: location || "",
        remote: !!remote,
      },
    }
  );

  return NextResponse.json({ message: "Preferences saved" });
}
