import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Reblet — SWE Career Tips & Job Search Advice",
  description:
    "Career advice for software engineers — internship guides, salary data, interview tips, and job search strategies for new grads and interns.",
  openGraph: {
    title: "Reblet Blog — SWE Career Tips & Job Search Advice",
    description:
      "Career advice, salary guides, and job search strategies for software engineers.",
    type: "website",
    url: "https://www.reblet.com/blog",
    siteName: "Reblet",
  },
  alternates: {
    canonical: "https://www.reblet.com/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Blog
        </h1>
        <p className="text-gray-500 mt-3 text-base">
          Career advice, salary guides, and job search tips for software
          engineers.
        </p>

        <div className="mt-12 flex flex-col gap-10">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <time className="text-sm text-gray-400">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="text-xl font-semibold text-gray-900 mt-1 group-hover:text-green-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  {post.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 mt-3">
                  Read more
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
