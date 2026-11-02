import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllPosts } from "@/lib/blog";

export const instant = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Reblet`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://www.reblet.com/blog/${post.slug}`,
      siteName: "Reblet",
      publishedTime: post.date,
    },
    alternates: {
      canonical: `https://www.reblet.com/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
        >
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
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to blog
        </Link>

        <header className="mb-10">
          <time className="text-sm text-gray-400">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="text-sm text-gray-300 mx-2">·</span>
          <span className="text-sm text-gray-400">{post.readTime}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-3 leading-tight">
            {post.title}
          </h1>
        </header>

        <div className="prose prose-gray max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-table:text-sm">
          <BlogContent content={post.content} />
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            Currently looking?{" "}
            <Link href="/jobs" className="text-green-600 font-medium hover:underline">
              Check out what's posted on Reblet
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}

function BlogContent({ content }: { content: string }) {
  const blocks = content.split("\n\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    if (block.startsWith("## ")) {
      elements.push(<h2 key={i}>{block.slice(3)}</h2>);
    } else if (block.startsWith("### ")) {
      elements.push(<h3 key={i}>{block.slice(4)}</h3>);
    } else if (block.startsWith("| ")) {
      const rows = block.split("\n").filter((r) => !r.match(/^\|[\s-|]+\|$/));
      const headerCells = rows[0]
        ?.split("|")
        .filter(Boolean)
        .map((c) => c.trim());
      const bodyRows = rows.slice(1);
      elements.push(
        <div key={i} className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {headerCells?.map((cell, ci) => (
                  <th key={ci}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row
                    .split("|")
                    .filter(Boolean)
                    .map((cell, ci) => (
                      <td key={ci}>{cell.trim()}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (block.startsWith("- ") || block.startsWith("1. ")) {
      const isOrdered = block.startsWith("1. ");
      const items = block.split("\n").map((line) =>
        line.replace(/^[-\d]+[.)]\s*/, "")
      );
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag key={i}>
          {items.map((item, li) => (
            <li key={li} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </Tag>
      );
    } else {
      elements.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(block) }} />
      );
    }
  }

  return <>{elements}</>;
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}
