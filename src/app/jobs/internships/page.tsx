import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "Software Engineering Internships 2027 | Reblet",
  description:
    "SWE internship openings at Google, Amazon, Meta, Stripe, and other tech companies. We add new ones as we find them.",
  openGraph: {
    title: "Software Engineering Internships 2027",
    description:
      "SWE internship openings at tech companies. New roles added regularly.",
    type: "website",
    url: "https://www.reblet.com/jobs/internships",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/jobs/internships",
  },
};

export default function InternshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <FilteredJobsPage
      filters={{ experienceType: "Internship" }}
      searchParams={searchParams}
      heading="Software Engineering Internships"
      subheading="Internship openings at tech companies. We add new ones as we find them."
    />
  );
}
