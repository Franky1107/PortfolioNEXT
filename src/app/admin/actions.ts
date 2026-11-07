"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/blog/auth";
import { db, POSTS_TAG } from "@/lib/blog/data";
import { slugify } from "@/lib/blog/repo";
import { makeToken, passwordOk, SESSION_COOKIE, SESSION_DAYS } from "@/lib/blog/session";

export type FormState = { error?: string };

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const secret = process.env.SESSION_SECRET;
  if (!process.env.ADMIN_PASSWORD) return { error: "Login isn’t set up yet: ADMIN_PASSWORD is missing." };
  if (!secret) return { error: "Login isn’t set up yet: SESSION_SECRET is missing." };
  if (secret.length < 32) return { error: `SESSION_SECRET is too short (${secret.length} characters) — use at least 32, then redeploy.` };
  if (!passwordOk(String(form.get("password") ?? ""), process.env.ADMIN_PASSWORD)) {
    await new Promise((r) => setTimeout(r, 800)); // shortcut: slows guessing a little; add a Vercel Firewall rate limit on /admin/login for real protection
    return { error: "Wrong password." };
  }
  (await cookies()).set(SESSION_COOKIE, makeToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

const LIMITS = { title: 200, summary: 400, body: 200_000 };

export async function savePost(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const repo = db();
  if (!repo) return { error: "No database connected (DATABASE_URL)." };

  const id = Number(form.get("id")) || undefined;
  const title = String(form.get("title") ?? "").trim();
  const summary = String(form.get("summary") ?? "").trim();
  const body = String(form.get("body") ?? "");
  const slug = slugify(String(form.get("slug") ?? "") || title);
  const published = form.get("published") === "on";
  if (!title || !slug) return { error: "Give the post a title." };
  if (title.length > LIMITS.title || summary.length > LIMITS.summary || body.length > LIMITS.body) return { error: "Too long — shorten the title, summary or post." };
  if (await repo.slugTaken(slug, id)) return { error: `Another post already uses the address /blog/${slug}.` };

  const saved = await repo.save({ slug, title, summary, body, published }, id);
  if (!saved) return { error: "That post no longer exists." };
  updateTag(POSTS_TAG); // the public blog shows the change right away
  redirect(`/admin?saved=${saved.id}`);
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (id) await db()?.remove(id);
  updateTag(POSTS_TAG);
  redirect("/admin");
}
