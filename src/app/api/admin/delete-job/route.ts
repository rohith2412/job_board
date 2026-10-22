import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { SavedJob } from "@/models/SavedJob";

const ADMIN_EMAIL = "rohithra75@gmail.com";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  await connectDB();

  const job = await SavedJob.findOneAndDelete({ slug });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${slug}`);
  revalidatePath("/");

  return NextResponse.json({ success: true, deleted: slug });
}
