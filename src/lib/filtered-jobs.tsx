import { getPaginatedFeaturedJobs, getFeaturedJobsCount, getJobFilterOptions, getCompanyLogos, getJobPosters, type JobFilters } from "@/lib/data";
import { cleanSnippet } from "@/lib/utils";
import JobsFilter from "@/components/JobsFilter";

export async function FilteredJobsPage({
  filters,
  searchParams,
  heading,
  subheading,
}: {
  filters: JobFilters;
  searchParams: Promise<Record<string, string | undefined>>;
  heading: string;
  subheading: string;
}) {
  const params = await searchParams;
  const pageSize = 10;
  const requestedPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const mergedFilters: JobFilters = { ...filters };
  if (params.q) mergedFilters.search = params.q;

  const [totalCount, logoMap, filterOptions] = await Promise.all([
    getFeaturedJobsCount(mergedFilters),
    getCompanyLogos(),
    getJobFilterOptions(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  const jobs = await getPaginatedFeaturedJobs(currentPage, pageSize, mergedFilters);

  const posterEmails = (jobs as any[])
    .map((j: any) => j.postedByEmail)
    .filter((e: string) => e);
  const posterMap = await getJobPosters([...new Set(posterEmails)]);

  const serialized = jobs.map(
    (job: {
      slug: string;
      title: string;
      company: string;
      location: string;
      salary: string;
      snippet: string;
      link: string;
      experienceType?: string;
      createdAt?: string;
      source?: string;
      description?: string;
      applyUrl?: string;
      postedByEmail?: string;
    }) => {
      const poster = job.postedByEmail ? posterMap[job.postedByEmail] : undefined;
      return {
        slug: job.slug,
        title: job.title,
        company: job.company,
        location: job.location || "",
        salary: job.salary || "",
        snippet: cleanSnippet(job.snippet).slice(0, 120),
        link: job.link || "",
        experienceType: job.experienceType || (job.title.toLowerCase().includes("intern") ? "Internship" : "Full-time"),
        createdAt: job.createdAt || "2024-01-01T00:00:00.000Z",
        source: job.source || "",
        description: job.description || "",
        applyUrl: job.applyUrl || "",
        logo: job.source === "company" ? (logoMap[job.company] || "") : "",
        postedByName: poster?.name || "",
        postedByImage: poster?.image || "",
      };
    }
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {heading}
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">{subheading}</p>
        </div>
        <JobsFilter
          jobs={serialized}
          locations={filterOptions.locations}
          companies={filterOptions.companies}
          experienceTypes={filterOptions.types}
          currentPage={currentPage}
          totalPages={totalPages}
          totalJobs={totalCount}
          hasFilters={true}
        />
      </div>
    </main>
  );
}
