import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Single-admin login. The password lives only in the ADMIN_PASSWORD env var;
 * a successful login gets a cookie "expiry.signature" signed with SESSION_SECRET.
 * Changing SESSION_SECRET logs every session out.
 */
export const SESSION_COOKIE = "blog_admin";
export const SESSION_DAYS = 7;

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(`admin.${payload}`).digest("base64url");

/** constant-time string compare (hashing first makes the lengths equal) */
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export function passwordOk(given: string, expected: string | undefined) {
  return !!expected && given.length > 0 && same(given, expected);
}

export function makeToken(secret: string, now = Date.now()) {
  const exp = String(now + SESSION_DAYS * 86_400_000);
  return `${exp}.${sign(exp, secret)}`;
}

export function tokenOk(token: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!token || !secret) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return same(sig, sign(exp, secret));
}
