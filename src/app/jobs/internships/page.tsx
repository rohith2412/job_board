import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "Software Engineering Internships 2027 | Reblet",
  description:
    "Find the best software engineering internships for Summer 2027. Browse SWE intern roles at Google, Amazon, Meta, Stripe and more top tech companies. Updated daily.",
  openGraph: {
    title: "Software Engineering Internships 2027",
    description:
      "Find the best software engineering internships for Summer 2027. Updated daily.",
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
      subheading="SWE internship openings at top tech companies, updated daily."
    />
  );
}
