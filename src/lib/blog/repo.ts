/**
 * Blog posts in Postgres — plain SQL, no framework. `makeRepo` takes a query
 * function so the same code runs on Neon (production) and an in-memory
 * Postgres (scripts/test-blog.mts).
 */
export type Post = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string; // Markdown
  published: boolean;
  publishedAt: string | null; // ISO date
  updatedAt: string;
};
export type PostInput = { slug: string; title: string; summary: string; body: string; published: boolean };
export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

const COLS = "id, slug, title, summary, body, published, published_at, updated_at";
const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());
const toPost = (r: Record<string, unknown>): Post => ({
  id: Number(r.id),
  slug: String(r.slug),
  title: String(r.title),
  summary: String(r.summary),
  body: String(r.body),
  published: Boolean(r.published),
  publishedAt: iso(r.published_at),
  updatedAt: iso(r.updated_at)!,
});

/** "Hello, World! 2026" → "hello-world-2026" */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function makeRepo(query: Query) {
  let ready: Promise<unknown> | null = null;
  // creates the table on first use, so a fresh database needs no setup step
  const q: Query = async (text, params) => {
    ready ??= query(SCHEMA);
    await ready;
    return query(text, params);
  };

  return {
    async listPublished() {
      return (await q(`SELECT ${COLS} FROM posts WHERE published ORDER BY published_at DESC, id DESC`)).map(toPost);
    },
    async getPublished(slug: string) {
      const [r] = await q(`SELECT ${COLS} FROM posts WHERE slug = $1 AND published`, [slug]);
      return r ? toPost(r) : null;
    },
    async listAll() {
      return (await q(`SELECT ${COLS} FROM posts ORDER BY updated_at DESC, id DESC`)).map(toPost);
    },
    async get(id: number) {
      const [r] = await q(`SELECT ${COLS} FROM posts WHERE id = $1`, [id]);
      return r ? toPost(r) : null;
    },
    /** create (no id) or update; keeps the first publish date when re-publishing */
    async save(input: PostInput, id?: number) {
      const p = [input.slug, input.title, input.summary, input.body, input.published];
      const [r] = id
        ? await q(
            `UPDATE posts SET slug=$1, title=$2, summary=$3, body=$4, published=$5,
               published_at = CASE WHEN $5 THEN COALESCE(published_at, now()) ELSE published_at END,
               updated_at = now()
             WHERE id = $6 RETURNING ${COLS}`,
            [...p, id],
          )
        : await q(
            `INSERT INTO posts (slug, title, summary, body, published, published_at)
             VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN now() END) RETURNING ${COLS}`,
            p,
          );
      return r ? toPost(r) : null;
    },
    async remove(id: number) {
      await q(`DELETE FROM posts WHERE id = $1`, [id]);
    },
    async slugTaken(slug: string, exceptId?: number) {
      return (await q(`SELECT 1 FROM posts WHERE slug = $1 AND id <> $2`, [slug, exceptId ?? 0])).length > 0;
    },
  };
}
export type Repo = ReturnType<typeof makeRepo>;
