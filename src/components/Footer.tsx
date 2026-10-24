import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <Link href="/" className="text-base font-bold text-gray-900">
              Reblet
            </Link>
            <p className="text-xs text-gray-400 mt-1">
              Curated software engineering jobs in USA & Canada
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/jobs" className="hover:text-gray-800 transition-colors">Jobs</Link>
            <Link href="/companies" className="hover:text-gray-800 transition-colors">Companies</Link>
            <Link href="/about" className="hover:text-gray-800 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-gray-800 transition-colors">Contact</Link>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; 2026 Reblet. All rights reserved.
          </p>
          <nav className="flex gap-x-5 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <a href="mailto:rayandteamsupport@gmail.com" className="hover:text-gray-600 transition-colors">Support</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
