import type { Metadata } from "next";
import { getAllFeaturedJobs } from "@/lib/data";
import { cleanSnippet } from "@/lib/utils";
import JobsFilter from "@/components/JobsFilter";

export const metadata: Metadata = {
  title: "Software Engineering Jobs in USA & Canada | Reblet",
  description:
    "Browse curated software engineering jobs at top tech companies in the United States and Canada. Find roles at PolicyMe, Kepler Communications, Greenhouse, Maple, Lever and more.",
  openGraph: {
    title: "Software Engineering Jobs in USA & Canada",
    description:
      "Browse curated software engineering jobs at top tech companies in the USA and Canada.",
    type: "website",
    url: "https://www.reblet.com/jobs",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/jobs",
  },
};

export default async function JobsPage() {
  const jobs = await getAllFeaturedJobs();

  const serialized = jobs
    .map(
      (job: {
        slug: string;
        title: string;
        company: string;
        location: string;
        salary: string;
        snippet: string;
        createdAt?: string;
      }) => ({
        slug: job.slug,
        title: job.title,
        company: job.company,
        location: job.location || "",
        salary: job.salary || "",
        snippet: cleanSnippet(job.snippet).slice(0, 120),
        createdAt: job.createdAt || new Date().toISOString(),
      })
    )
    .sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const locations = [
    ...new Set(
      serialized
        .map((j: { location: string }) => j.location)
        .filter(
          (loc: string) => loc && !loc.toLowerCase().includes("remote")
        ) as string[]
    ),
  ].sort();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl flex flex-col min-h-screen">
        <JobsFilter jobs={serialized} locations={locations} />
      </div>
    </main>
  );
}
