import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/blog/auth";
import { db } from "@/lib/blog/data";
import { formatDate } from "@/lib/blog/format";
import { logout } from "./actions";

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="font-mono text-[13px] text-white/40">Loading…</p>}>
      <Posts />
    </Suspense>
  );
}

async function Posts() {
  await requireAdmin();
  const repo = db();
  const posts = (await repo?.listAll()) ?? [];
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8">
        <h1 className="type-heavy text-[clamp(2.4rem,6vw,4rem)] uppercase leading-none">Your posts</h1>
        <div className="flex items-center gap-6">
          <Link href="/admin/new" className="rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-black hover:bg-accent hover:text-white">
            + New post
          </Link>
          <form action={logout}>
            <button className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/60 hover:text-accent">Log out</button>
          </form>
        </div>
      </div>
      {!repo && <p className="mt-8 font-mono text-[13px] text-accent">No database connected yet — add DATABASE_URL (connect Neon in Vercel).</p>}
      {repo && posts.length === 0 && <p className="mt-8 text-white/60">No posts yet. Write your first one.</p>}
      <ul>
        {posts.map((p) => (
          <li key={p.id} className="border-b border-white/10">
            <Link href={`/admin/edit/${p.id}`} className="group flex flex-wrap items-baseline justify-between gap-3 py-5">
              <span className="text-[19px] font-medium group-hover:text-accent">{p.title}</span>
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-white/45">
                {p.published ? `Published ${formatDate(p.publishedAt)}` : "Draft"} · edited {formatDate(p.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
