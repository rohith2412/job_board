import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | Reblet",
  description: "Get in touch with the Reblet team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-3">Contact Us</h1>
        <p className="text-base text-gray-500 mb-10">
          Have a question, found a bug, or want to partner with us? We&apos;d love to hear from you.
        </p>

        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Email</h2>
                <p className="text-sm text-gray-500 mt-1">Best way to reach us. We typically respond within 24 hours.</p>
                <a
                  href="mailto:rayandteamsupport@gmail.com"
                  className="inline-block mt-2 text-sm font-medium text-gray-800 underline hover:text-gray-600 transition-colors"
                >
                  rayandteamsupport@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">LinkedIn</h2>
                <p className="text-sm text-gray-500 mt-1">Follow us for the latest job postings and updates.</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Common Questions</h2>
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">How do I post a job?</p>
                <p className="text-gray-500 mt-1">
                  Sign in with Google, go to{" "}
                  <Link href="/post-job" className="text-gray-800 underline hover:text-gray-600">Post a Job</Link>,
                  set up your company profile, and create your listing.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Is it free for job seekers?</p>
                <p className="text-gray-500 mt-1">Yes, Reblet is completely free for job seekers. Browse, search, and apply without any cost.</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">How do I delete my data?</p>
                <p className="text-gray-500 mt-1">
                  Email us at{" "}
                  <a href="mailto:rayandteamsupport@gmail.com" className="text-gray-800 underline hover:text-gray-600">rayandteamsupport@gmail.com</a>{" "}
                  and we&apos;ll remove your data within 30 days.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">I found a bug or have a suggestion.</p>
                <p className="text-gray-500 mt-1">Send us an email - we read every message and appreciate all feedback.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
