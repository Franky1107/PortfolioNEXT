import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { publishedPost } from "@/lib/blog/data";
import { formatDate, readingMinutes, renderMarkdown } from "@/lib/blog/format";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const post = await publishedPost((await params).slug);
  return post ? { title: `${post.title} — Sourav Mallick`, description: post.summary || undefined } : { title: "Post not found" };
}

export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<p className="pt-10 font-mono text-[13px] text-white/40">Loading…</p>}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const post = await publishedPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="pt-10">
      <Link href="/blog" className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/50 hover:text-accent">
        ← All posts
      </Link>
      <h1 className="type-heavy mt-6 text-[clamp(2rem,6vw,3.2rem)] leading-[1.02]">{post.title}</h1>
      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.1em] text-white/45">
        <time dateTime={post.publishedAt!}>{formatDate(post.publishedAt)}</time> · {readingMinutes(post.body)} min read
      </p>
      <div className="prose-blog mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
    </article>
  );
}
