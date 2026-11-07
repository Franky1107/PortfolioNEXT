/**
 * POST /api/contact — emails a contact-form message to me via Resend.
 *
 * Needs two environment variables (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY   your Resend API key (resend.com → API Keys)
 *   CONTACT_TO       where messages go (must be the email your Resend account is
 *                    registered with, until you verify your own domain there)
 * Optional: CONTACT_FROM (defaults to Resend's test sender "onboarding@resend.dev").
 * Without a key it answers 503 and the form falls back to the visitor's mail app.
 */
const LIMITS = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) return Response.json({ error: "Email is not set up yet." }, { status: 503 });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  // bots fill the hidden "website" field; pretend it worked
  if (data.website) return Response.json({ ok: true });

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "").trim();
  if (!name || !message || !EMAIL_RE.test(email) || name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return Response.json({ error: "Please check your name, email and message." }, { status: 400 });
  }

  // shortcut: no rate limiting — add one (e.g. Vercel Firewall rule on /api/contact) if spam shows up
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `Portfolio contact <${process.env.CONTACT_FROM || "onboarding@resend.dev"}>`,
      to: [to],
      reply_to: email, // hit Reply in your inbox to answer the visitor
      subject: `Portfolio: message from ${name.replace(/[\r\n]+/g, " ")}`,
      text: `${message}\n\n— ${name} <${email}>`, // plain text only, so nothing the visitor typed is rendered as HTML
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return Response.json({ error: "Couldn't send right now — please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
