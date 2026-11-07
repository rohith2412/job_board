import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FEATURED_STUDENTS_TAG, claimPurchase } from "@/lib/featured";
import { isCountryCode } from "@/lib/countries";
import {
  HIGHLIGHT_MAX_LENGTH,
  MAX_HIGHLIGHTS,
  isHighlightKind,
  type Highlight,
} from "@/lib/highlights";
import { FeaturedStudent } from "@/models/FeaturedStudent";

const MAX_SKILLS = 20;
const MAX_LINKS = 10;

type Profile = {
  name: string;
  school: string;
  gradYear: string;
  country: string;
  headline: string;
  highlights: Highlight[];
  skills: string[];
  github: string;
  linkedin: string;
  resume: string;
  portfolio: string;
  links: string[];
};

function text(value: unknown, label: string, max: number, required: boolean) {
  const v = typeof value === "string" ? value.trim() : "";
  if (required && !v) throw new Error(`${label} is required`);
  if (v.length > max) throw new Error(`${label} must be ${max} characters or fewer`);
  return v;
}

function url(value: unknown, label: string) {
  const v = text(value, label, 500, false);
  if (!v) return "";
  let parsed: URL;
  try {
    parsed = new URL(v);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} must start with http:// or https://`);
  }
  return parsed.toString();
}

function list(value: unknown, label: string, max: number) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${label} must be a list`);
  if (value.length > max) throw new Error(`Up to ${max} ${label.toLowerCase()} allowed`);
  return value;
}

function highlights(value: unknown): Highlight[] {
  const parsed = list(value, "Highlights", MAX_HIGHLIGHTS)
    .map((h): Highlight | null => {
      const item = (h ?? {}) as Record<string, unknown>;
      const t = text(item.text, "Each highlight", HIGHLIGHT_MAX_LENGTH, false);
      if (!t) return null;
      if (!isHighlightKind(item.kind)) throw new Error("Choose a type for each highlight");
      return { kind: item.kind, text: t };
    })
    .filter((h): h is Highlight => h !== null);
  if (parsed.length === 0) throw new Error("Add at least one highlight");
  return parsed;
}

function parseProfile(body: Record<string, unknown>): Profile {
  const gradYear = text(body.gradYear, "Graduation year", 4, true);
  if (!/^(19|20)\d{2}$/.test(gradYear)) throw new Error("Graduation year must be a 4-digit year");

  if (!isCountryCode(body.country)) throw new Error("Choose your country");

  return {
    name: text(body.name, "Full name", 100, true),
    school: text(body.school, "School", 150, true),
    gradYear,
    country: body.country,
    headline: text(body.headline, "Headline", 160, true),
    highlights: highlights(body.highlights),
    skills: list(body.skills, "Skills", MAX_SKILLS)
      .map((s) => text(s, "Each skill", 40, false))
      .filter(Boolean),
    github: url(body.github, "GitHub URL"),
    linkedin: url(body.linkedin, "LinkedIn URL"),
    resume: url(body.resume, "Resume URL"),
    portfolio: url(body.portfolio, "Portfolio URL"),
    links: list(body.links, "Links", MAX_LINKS)
      .map((l) => url(l, "Each link"))
      .filter(Boolean),
  };
}

export async function POST(req: NextRequest) {
  await connection();

  const authSession = await getServerSession(authOptions);
  const email = authSession?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }

  let profile: Profile;
  try {
    profile = parseProfile(body);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const record = await claimPurchase(sessionId, { email, name: authSession?.user?.name });
  if (!record) {
    return NextResponse.json({ error: "No payment found for this account" }, { status: 403 });
  }
  if (!record.expiresAt || record.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This featured period has expired" }, { status: 410 });
  }
  if (!record.image) {
    return NextResponse.json({ error: "Professional photo is required" }, { status: 400 });
  }

  await FeaturedStudent.updateOne({ _id: record._id }, { $set: profile });
  revalidateTag(FEATURED_STUDENTS_TAG, "max");
  return NextResponse.json({ ok: true });
}
