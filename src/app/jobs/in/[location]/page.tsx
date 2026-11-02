import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilteredJobsPage } from "@/lib/filtered-jobs";
import { getJobFilterOptions } from "@/lib/data";

export const instant = false;

function extractCity(location: string): string {
  return location
    .replace(/\s*\(.*?\)\s*/g, "")
    .split(",")[0]
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function citySlug(location: string): string {
  return slugify(extractCity(location));
}

export async function generateStaticParams() {
  const options = await getJobFilterOptions();
  const seen = new Set<string>();
  const params: { location: string }[] = [];
  for (const loc of options.locations) {
    const slug = citySlug(loc);
    if (!slug || slug === "remote" || seen.has(slug)) continue;
    seen.add(slug);
    params.push({ location: slug });
    if (params.length >= 30) break;
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const options = await getJobFilterOptions();
  const matched = options.locations.find(
    (loc: string) => citySlug(loc) === location
  );
  const city = matched ? extractCity(matched) : location.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    title: `Software Engineering Jobs in ${city} | Reblet`,
    description: `SWE internships and full-time roles in ${city}. Salary info included where available.`,
    openGraph: {
      title: `Software Engineering Jobs in ${city}`,
      description: `SWE internships and full-time roles in ${city}.`,
      type: "website",
      url: `https://www.reblet.com/jobs/in/${location}`,
      siteName: "Reblet",
    },
    alternates: {
      canonical: `https://www.reblet.com/jobs/in/${location}`,
    },
  };
}

export default async function LocationJobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { location } = await params;
  const options = await getJobFilterOptions();

  const matched = options.locations.find(
    (loc: string) => citySlug(loc) === location
  );

  if (!matched) notFound();

  const city = extractCity(matched);
  const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    <FilteredJobsPage
      filters={{ location: `^${escaped}` }}
      searchParams={searchParams}
      heading={`SWE Jobs in ${city}`}
      subheading={`SWE internships and full-time roles in ${city}.`}
    />
  );
}
