import type { Metadata } from "next";
import { FilteredJobsPage } from "@/lib/filtered-jobs";

export const instant = false;

export const metadata: Metadata = {
  title: "New Grad Software Engineer Jobs 2027 | Reblet",
  description:
    "Full-time software engineering roles for recent grads. We pull from company career pages so you don't have to.",
  openGraph: {
    title: "New Grad Software Engineer Jobs 2027",
    description:
      "Full-time SWE roles for recent grads and entry-level engineers.",
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
      subheading="Full-time roles for recent grads and entry-level engineers."
    />
  );
}
