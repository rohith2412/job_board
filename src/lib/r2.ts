import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

export function r2KeyFromUrl(url: string): string | null {
  const prefix = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export async function deleteFromR2(key: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET!, Key: key })
  );
}
