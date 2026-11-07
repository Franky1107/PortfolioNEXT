// Self-check for /api/contact (Resend is stubbed). Run: npm run test:contact
import assert from "node:assert/strict";
const { POST } = await import("../src/app/api/contact/route.ts");
const call = (body: unknown) => POST(new Request("http://x/api/contact", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
let sent: any = null;
globalThis.fetch = (async (_u: string, init: any) => { sent = JSON.parse(init.body); return new Response("{}", { status: 200 }); }) as any;
const good = { name: "Asha", email: "asha@example.com", message: "Hi <b>there</b>" };

delete process.env.RESEND_API_KEY;
assert.equal((await call(good)).status, 503, "no key → 503 (form falls back to mail app)");
process.env.RESEND_API_KEY = "test"; process.env.CONTACT_TO = "me@example.com";
assert.equal((await call("not json")).status, 400);
assert.equal((await call({ ...good, email: "nope" })).status, 400);
assert.equal((await call({ ...good, message: "" })).status, 400);
assert.equal((await call({ ...good, name: "x".repeat(101) })).status, 400);
sent = null; assert.equal((await call({ ...good, website: "spam.com" })).status, 200); assert.equal(sent, null, "honeypot: nothing sent");
const r = await call({ ...good, name: "Asha\nBcc: evil@x.com" });
assert.equal(r.status, 200);
assert.deepEqual(sent.to, ["me@example.com"]); assert.equal(sent.reply_to, "asha@example.com");
assert.ok(!sent.subject.includes("\n"), "no header injection via name"); assert.ok(sent.text.includes("Hi <b>there</b>") && !("html" in sent), "plain text only");
globalThis.fetch = (async () => new Response("bad", { status: 500 })) as any;
const orig = console.error; console.error = () => {}; assert.equal((await call(good)).status, 502); console.error = orig;
console.log("all route checks passed");
