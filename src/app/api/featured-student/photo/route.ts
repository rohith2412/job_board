import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claimPurchase } from "@/lib/featured";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/r2";
import { FeaturedStudent } from "@/models/FeaturedStudent";

const MAX_BYTES = 5 * 1024 * 1024;

// The client-declared MIME type is untrusted, so the format is detected from the file's magic bytes.
function detectImage(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", type: "image/jpeg" };
  }
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", type: "image/png" };
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", type: "image/webp" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  await connection();

  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const sessionId = form.get("sessionId");
  const file = form.get("file");
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a photo to upload" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be 5 MB or smaller" }, { status: 413 });
  }

  const record = await claimPurchase(sessionId, { email, name: authSession?.user?.name });
  if (!record) {
    return NextResponse.json({ error: "No payment found for this account" }, { status: 403 });
  }
  if (!record.expiresAt || record.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This featured period has expired" }, { status: 410 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = detectImage(buffer);
  if (!image) {
    return NextResponse.json({ error: "Photo must be a JPG, PNG, or WebP image" }, { status: 415 });
  }

  const key = `featured-students/${record._id}/${randomUUID()}.${image.ext}`;
  let url: string;
  try {
    url = await uploadToR2(key, buffer, image.type);
  } catch (err) {
    console.error("Featured photo upload failed:", err);
    return NextResponse.json({ error: "Upload failed, please try again" }, { status: 502 });
  }

  const previous = record.image;
  await FeaturedStudent.updateOne({ _id: record._id }, { $set: { image: url } });

  const previousKey = previous ? r2KeyFromUrl(previous) : null;
  if (previousKey?.startsWith(`featured-students/${record._id}/`)) {
    deleteFromR2(previousKey).catch((err) => console.error("Old featured photo cleanup failed:", err));
  }

  return NextResponse.json({ url });
}
