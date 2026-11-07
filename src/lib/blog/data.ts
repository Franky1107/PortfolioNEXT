import "server-only";
import { neon } from "@neondatabase/serverless";
import { cacheLife, cacheTag } from "next/cache";
import { makeRepo, type Repo } from "./repo";

/**
 * The blog's database (Neon Postgres via DATABASE_URL — added automatically when
 * you connect a Neon database to the project on Vercel).
 * Public reads are cached and tagged "posts"; saving a post clears the tag.
 */
export const POSTS_TAG = "posts";

let repo: Repo | null = null;
export function db(): Repo | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!repo) {
    const sql = neon(url);
    repo = makeRepo((text, params) => sql.query(text, params ?? []) as Promise<Record<string, unknown>[]>);
  }
  return repo;
}

export async function publishedPosts() {
  "use cache";
  cacheLife("max");
  cacheTag(POSTS_TAG);
  return (await db()?.listPublished()) ?? [];
}

export async function publishedPost(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(POSTS_TAG);
  return (await db()?.getPublished(slug)) ?? null;
}
