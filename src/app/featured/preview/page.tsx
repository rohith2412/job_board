import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FeaturedCard, { type FeaturedCardProfile } from "@/components/FeaturedCard";

export const metadata: Metadata = {
  title: "Featured Card Preview | Reblet",
  robots: { index: false, follow: false },
};

const placeholderPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#d9f99d"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <circle cx="256" cy="200" r="92" fill="#14532d"/>
    <path d="M86 512c0-104 76-176 170-176s170 72 170 176z" fill="#14532d"/>
  </svg>`
)}`;

const sample: FeaturedCardProfile = {
  name: "Jordan Rivera",
  image: placeholderPhoto,
  headline: "CS junior building full-stack apps, seeking Summer 2027 SWE internships",
  school: "University of Maryland",
  gradYear: "2027",
  highlights: [
    { kind: "experience", text: "SWE Intern at Capital One, shipped a fraud alert service to 2M users" },
    { kind: "award", text: "1st place at HackMIT 2025, out of 200 teams" },
    { kind: "leadership", text: "President, UMD App Dev Club (300 members)" },
  ],
  linkedin: "https://linkedin.com/in/example",
  github: "https://github.com/example",
  resume: "https://example.com/resume.pdf",
  portfolio: "https://example.com",
};

// Design preview for the featured card; never served in production.
export default function FeaturedCardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-gray-50 px-4 py-8">
      <FeaturedCard profile={sample} />
    </main>
  );
}
