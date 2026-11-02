import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "Remote Software Engineering Jobs | Reblet",
  description:
    "Remote SWE jobs you can do from anywhere. Intern and new grad roles included.",
  openGraph: {
    title: "Remote Software Engineering Jobs",
    description:
      "Remote SWE jobs you can do from anywhere.",
    type: "website",
    url: "https://www.reblet.com/jobs/remote",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/jobs/remote",
  },
};

export default function RemotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <FilteredJobsPage
      filters={{ remote: true }}
      searchParams={searchParams}
      heading="Remote Software Engineering Jobs"
      subheading="SWE roles you can do from anywhere. Intern and full-time."
    />
  );
}
