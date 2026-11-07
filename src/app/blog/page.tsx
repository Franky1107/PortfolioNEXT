import type { Metadata } from "next";
import Link from "next/link";
import { publishedPosts } from "@/lib/blog/data";
import { formatDate } from "@/lib/blog/format";

export const metadata: Metadata = {
  title: "Blog — Sourav Mallick",
  description: "Notes on data engineering, AI and building software, by Sourav Mallick.",
};

export default async function BlogIndex() {
  const posts = await publishedPosts();
  const years = [...new Set(posts.map((p) => new Date(p.publishedAt!).getFullYear()))];

  return (
    <>
      <section className="pb-14 pt-10">
        <h1 className="type-heavy text-[clamp(2.4rem,7vw,3.6rem)] uppercase leading-[0.95]">Writing</h1>
        <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-white/70">
          Notes from a software engineer working across <mark className="bg-transparent text-accent">data engineering, AI and intelligent systems</mark> —
          what I’m building, learning and untangling.
        </p>
      </section>

      {posts.length === 0 ? (
        <p className="border-t border-white/10 pt-8 font-mono text-[13px] text-white/50">No posts yet — check back soon.</p>
      ) : (
        years.map((year) => (
          <section key={year} className="border-t border-white/10 py-8">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-white/40">{year}</h2>
            <ul className="mt-4">
              {posts
                .filter((p) => new Date(p.publishedAt!).getFullYear() === year)
                .map((p) => (
                  <li key={p.id}>
                    <Link href={`/blog/${p.slug}`} className="group flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
                      <time dateTime={p.publishedAt!} className="w-28 shrink-0 font-mono text-[12px] uppercase tracking-[0.08em] text-white/45">
                        {formatDate(p.publishedAt)}
                      </time>
                      <span>
                        <span className="text-[18px] font-medium leading-snug underline-offset-4 group-hover:text-accent group-hover:underline">{p.title}</span>
                        {p.summary && <span className="mt-1 block text-[15px] leading-relaxed text-white/55">{p.summary}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
