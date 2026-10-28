export default function JobsLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl flex flex-col min-h-screen">
        <div className="flex-1 px-4 sm:px-6 pt-6 pb-10">
          {/* Search bar skeleton */}
          <div className="mb-5">
            <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
          </div>

          {/* Filter chips skeleton */}
          <div className="flex gap-2 mb-6 overflow-hidden">
            {[100, 90, 100, 110, 80].map((w, i) => (
              <div
                key={i}
                className="h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0"
                style={{ width: w }}
              />
            ))}
          </div>

          {/* Job count skeleton */}
          <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-4" />

          {/* Job card skeletons */}
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-xl border border-gray-100"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                      <div className="h-3.5 bg-gray-100 rounded animate-pulse w-20" />
                    </div>
                    <div className="h-3 bg-gray-50 rounded animate-pulse w-16" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
