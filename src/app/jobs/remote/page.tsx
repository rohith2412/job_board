import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "Remote Software Engineering Jobs | Reblet",
  description:
    "Find remote software engineering jobs and work-from-home SWE positions. Intern and new grad remote roles at top tech companies. Updated daily.",
  openGraph: {
    title: "Remote Software Engineering Jobs",
    description:
      "Remote SWE jobs and work-from-home positions. Updated daily.",
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
      subheading="Work-from-home SWE positions for interns and new grads."
    />
  );
}
