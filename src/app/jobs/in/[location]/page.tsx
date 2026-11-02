import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilteredJobsPage } from "@/lib/filtered-jobs";
import { getJobFilterOptions } from "@/lib/data";

export const instant = false;

function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateStaticParams() {
  const options = await getJobFilterOptions();
  return options.locations.slice(0, 30).map((loc: string) => ({
    location: slugify(loc),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const city = unslugify(location);
  return {
    title: `Software Engineering Jobs in ${city} | Reblet`,
    description: `Find software engineering internships and new grad jobs in ${city}. Browse SWE roles with salary info. Updated daily.`,
    openGraph: {
      title: `Software Engineering Jobs in ${city}`,
      description: `SWE internships and new grad jobs in ${city}. Updated daily.`,
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

  const matchedLocation = options.locations.find(
    (loc: string) => slugify(loc) === location
  );

  if (!matchedLocation) notFound();

  const city = unslugify(location);

  return (
    <FilteredJobsPage
      filters={{ location: matchedLocation }}
      searchParams={searchParams}
      heading={`SWE Jobs in ${city}`}
      subheading={`Software engineering internships and new grad roles in ${city}.`}
    />
  );
}
