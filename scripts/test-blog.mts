// Self-check for the blog's SQL (real Postgres via PGlite, in memory) and the login token. Run: npm run test:blog
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { makeRepo, slugify } from "../src/lib/blog/repo.ts";
import { makeToken, passwordOk, tokenOk } from "../src/lib/blog/session.ts";

const pg = new PGlite();
const repo = makeRepo(async (text, params) => (await pg.query(text, params as any[])).rows as Record<string, unknown>[]);

// slugs
assert.equal(slugify("Hello, World! Café 2026"), "hello-world-cafe-2026");

// drafts stay private, publishing sets a date once
const a = await repo.save({ slug: "first", title: "First", summary: "s", body: "# Hi", published: false });
assert.ok(a && !a.published && a.publishedAt === null);
assert.equal((await repo.listPublished()).length, 0, "drafts are not public");
assert.equal(await repo.getPublished("first"), null);
const a2 = await repo.save({ slug: "first", title: "First!", summary: "s", body: "# Hi", published: true }, a.id);
assert.ok(a2?.published && a2.publishedAt);
const firstDate = a2!.publishedAt;
await new Promise((r) => setTimeout(r, 20));
const a3 = await repo.save({ slug: "first", title: "First!!", summary: "s", body: "edited", published: true }, a.id);
assert.equal(a3!.publishedAt, firstDate, "editing keeps the original publish date");
assert.equal((await repo.getPublished("first"))!.body, "edited");

// newest first, unique slugs, delete
await repo.save({ slug: "second", title: "Second", summary: "", body: "", published: true });
assert.deepEqual((await repo.listPublished()).map((p) => p.slug), ["second", "first"]);
assert.equal(await repo.slugTaken("second"), true);
assert.equal(await repo.slugTaken("first", a.id), false, "a post's own slug isn't 'taken'");
await assert.rejects(repo.save({ slug: "second", title: "dup", summary: "", body: "", published: false }), "duplicate slug rejected by the database");
await repo.remove(a.id);
assert.equal(await repo.get(a.id), null);
assert.equal((await repo.listAll()).length, 1);

// login
assert.equal(passwordOk("secret", "secret"), true);
assert.equal(passwordOk("Secret", "secret"), false);
assert.equal(passwordOk("", ""), false, "an empty password never works");
assert.equal(passwordOk("x", undefined), false, "no ADMIN_PASSWORD set → nobody can log in");
const t = makeToken("k", 1_000);
assert.equal(tokenOk(t, "k", 2_000), true);
assert.equal(tokenOk(t, "other", 2_000), false, "wrong secret");
assert.equal(tokenOk(t, "k", 1_000 + 8 * 86_400_000), false, "expired after 7 days");
assert.equal(tokenOk(t.replace(/^\d+/, "9999999999999"), "k", 2_000), false, "tampered expiry");
assert.equal(tokenOk(undefined, "k"), false);

console.log("all blog checks passed");
