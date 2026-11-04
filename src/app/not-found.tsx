import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center bg-gray-950 px-6 py-24">
      <div className="text-center">
        <p className="text-7xl font-bold text-white">404</p>
        <h1 className="mt-4 text-xl font-semibold text-white">
          Page not found
        </h1>
        <p className="mt-2 text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/jobs"
          className="mt-8 inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          Browse jobs
        </Link>
      </div>
    </main>
  );
}
