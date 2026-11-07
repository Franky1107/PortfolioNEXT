import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE, tokenOk } from "./session";

/** true when this request carries a valid admin session cookie */
export async function isAdmin() {
  await connection(); // checking the expiry reads the clock: only ever at request time
  return tokenOk((await cookies()).get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}

/** use at the top of every admin page and admin action */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
