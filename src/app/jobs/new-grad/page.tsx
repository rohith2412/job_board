import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "New Grad Software Engineer Jobs 2027 | Reblet",
  description:
    "Browse new grad software engineering jobs for 2027. Entry-level SWE positions at top companies with salary info. No experience required. Updated daily.",
  openGraph: {
    title: "New Grad Software Engineer Jobs 2027",
    description:
      "Entry-level software engineering positions at top companies. Updated daily.",
    type: "website",
    url: "https://www.reblet.com/jobs/new-grad",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/jobs/new-grad",
  },
};

export default function NewGradPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <FilteredJobsPage
      filters={{ experienceType: "Full-time" }}
      searchParams={searchParams}
      heading="New Grad Software Engineer Jobs"
      subheading="Entry-level SWE positions for recent graduates, updated daily."
    />
  );
}
