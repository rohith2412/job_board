import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { uploadToR2 } from "@/lib/r2";
import { CompanyLogo } from "@/models/CompanyLogo";

export const COMPANY_LOGOS_TAG = "company-logos";

const MIN_SIZE = 96;
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Reads width from PNG or JPEG headers, so tiny fallback favicons can be rejected.
function imageWidth(buf: Buffer, type: string) {
  if (type.includes("png") && buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") return buf.readUInt32BE(16);
  if (type.includes("jpeg") || type.includes("jpg")) {
    for (let i = 2; i < buf.length - 9; ) {
      if (buf[i] !== 0xff) return 0;
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) return buf.readUInt16BE(i + 7);
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return 0;
}

async function tryImage(url: string, minSize = MIN_SIZE) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, redirect: "follow", signal: AbortSignal.timeout(8000) });
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !/^image\/(png|jpe?g|webp|svg\+xml)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // SVG scales to any size; it's only served from storage and shown through <img>, where scripts never run.
    if (type === "image/svg+xml") return buf.length > 150 && buf.length < 200_000 && buf.toString("utf8", 0, 2000).includes("<svg") ? { buf, type } : null;
    if (buf.length < 300) return null;
    if (type !== "image/webp" && imageWidth(buf, type) < minSize) return null;
    return { buf, type };
  } catch {
    return null;
  }
}

// Icons the homepage declares (<link rel="apple-touch-icon">, sized <link rel="icon">, web manifest), largest first.
async function declaredIcons(domain: string) {
  try {
    const res = await fetch(`https://${domain}`, { headers: { "User-Agent": BROWSER_UA }, redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 300_000);
    const base = res.url;
    const found: { url: string; size: number }[] = [];
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
      const rel = tag.match(/rel=["']([^"']+)["']/i)?.[1].toLowerCase() ?? "";
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
      if (!href) continue;
      if (rel === "manifest") {
        try {
          const manifest = await fetch(new URL(href, base), { signal: AbortSignal.timeout(6000) }).then((r) => r.json());
          for (const icon of manifest.icons ?? []) {
            found.push({ url: new URL(icon.src, new URL(href, base)).href, size: parseInt(String(icon.sizes ?? "0"), 10) || 0 });
          }
        } catch {}
        continue;
      }
      if (!/icon/.test(rel) || /mask-icon/.test(rel)) continue;
      const size = parseInt(tag.match(/sizes=["'](\d+)/i)?.[1] ?? (/apple-touch-icon/.test(rel) ? "180" : "0"), 10);
      found.push({ url: new URL(href, base).href, size });
    }
    // Large raster icons first, then SVG (sharp at any size), then small rasters.
    const rank = (f: { url: string; size: number }) => (/\.svg(\?|$)/i.test(f.url) ? 150 : f.size);
    return found.filter((f) => !/\.ico(\?|$)/i.test(f.url)).sort((a, b) => rank(b) - rank(a));
  } catch {
    return [];
  }
}

// The company's own app icon first (sharp, square), then icons its homepage declares, then Google's favicon service.
async function fetchLogo(domain: string) {
  const direct = (await tryImage(`https://${domain}/apple-touch-icon.png`)) ?? (await tryImage(`https://www.${domain}/apple-touch-icon.png`));
  if (direct) return direct;
  for (const icon of (await declaredIcons(domain)).slice(0, 4)) {
    const image = await tryImage(icon.url);
    if (image) return image;
  }
  return (
    (await tryImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`)) ??
    (await tryImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, 48))
  );
}

// Returns the stored logo URL for a company, fetching and saving one to R2 the first time.
export async function ensureCompanyLogo(name: string, domain: string, { revalidate = true } = {}) {
  await connectDB();
  const existing = (await CompanyLogo.findOne({ name }).select("logo").lean()) as { logo?: string } | null;
  if (existing?.logo) return existing.logo;
  const image = await fetchLogo(domain);
  if (!image) return "";
  const ext = { "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" }[image.type] ?? "jpg";
  const url = await uploadToR2(`company-logos/${domain.replace(/[^a-z0-9.-]/gi, "")}.${ext}`, image.buf, image.type);
  await CompanyLogo.updateOne({ name }, { $set: { name, domain, logo: url } }, { upsert: true });
  if (revalidate) revalidateTag(COMPANY_LOGOS_TAG, "max");
  return url;
}
