"use client";

import { useActionState, useState } from "react";
import { renderMarkdown } from "@/lib/blog/format";
import type { Post } from "@/lib/blog/repo";
import { deletePost, savePost, type FormState } from "./actions";

const input = "w-full border-b border-white/20 bg-transparent pb-3 outline-none placeholder:text-white/30 focus:border-accent";
const label = "font-mono text-[12px] uppercase tracking-[0.12em] text-white/60";

/** Write / edit a post: Markdown on the left, live preview on the right. */
export default function Editor({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const [body, setBody] = useState(post?.body ?? "");

  return (
    <>
      <form action={action} className="flex flex-col gap-8">
        {post && <input type="hidden" name="id" value={post.id} />}
        <input name="title" required maxLength={200} defaultValue={post?.title} placeholder="Post title" aria-label="Title" className={`${input} type-heavy text-[clamp(1.8rem,4vw,3rem)]`} />
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <label className="flex flex-col gap-3">
            <span className={label}>Address (/blog/…)</span>
            <input name="slug" defaultValue={post?.slug} placeholder="from the title" className={`${input} font-mono text-[15px]`} />
          </label>
          <label className="flex flex-col gap-3">
            <span className={label}>Summary (shown in the list)</span>
            <input name="summary" maxLength={400} defaultValue={post?.summary} placeholder="One line about the post" className={`${input} text-[16px]`} />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-3">
            <span className={label}>Post (Markdown)</span>
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={26}
              placeholder={"## A heading\n\nWrite with **Markdown**: lists, [links](https://…), `code`, > quotes…"}
              className="min-h-[50svh] resize-y rounded-xl border border-white/15 bg-white/[0.03] p-5 font-mono text-[14px] leading-relaxed outline-none focus:border-accent"
            />
          </label>
          <div className="flex flex-col gap-3">
            <span className={label}>Preview</span>
            <div className="prose-blog min-h-[50svh] overflow-auto rounded-xl border border-white/10 p-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6">
          <label className="flex items-center gap-3 text-[16px]">
            <input type="checkbox" name="published" defaultChecked={post?.published ?? false} className="h-5 w-5 accent-[var(--accent)]" />
            Published (visible on the blog)
          </label>
          <div className="flex items-center gap-5">
            {state.error && <p role="alert" className="font-mono text-[12px] text-accent">{state.error}</p>}
            <button disabled={pending} className="rounded-full bg-white px-6 py-3 font-medium text-black hover:bg-accent hover:text-white disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>

      {post && (
        <form
          action={deletePost}
          onSubmit={(e) => {
            if (!confirm(`Delete “${post.title}” for good?`)) e.preventDefault();
          }}
          className="mt-10"
        >
          <input type="hidden" name="id" value={post.id} />
          <button className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/50 hover:text-accent">Delete post</button>
        </form>
      )}
    </>
  );
}
