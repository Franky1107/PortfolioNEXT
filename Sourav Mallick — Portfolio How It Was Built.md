# Sourav Mallick — Portfolio: How It Was Built

Nov 7, 2026 · @Sourav

## Overview

The portfolio is a single scroll-driven page for Sourav Mallick, a software engineer in data engineering, AI and intelligent systems, held together by one pink thread that draws itself through every section as you scroll. It was built from Sourav's Canva homepage design and grew section by section into a full site with a contact form backend and a private blog.

| What | Where |
| --- | --- |
| Live site (main) | [portfolionext-drab-gamma.vercel.app](https://portfolionext-drab-gamma.vercel.app) |
| Frozen copy (no longer updated) | [portfolionext2002.netlify.app](https://portfolionext2002.netlify.app) |
| Source code | [github.com/Franky1107/PortfolioNEXT](https://github.com/Franky1107/PortfolioNEXT) (public) |
| Blog | [/blog](https://portfolionext-drab-gamma.vercel.app/blog) · admin at [/admin](https://portfolionext-drab-gamma.vercel.app/admin) |
| Resume | [/resume.pdf](https://portfolionext-drab-gamma.vercel.app/resume.pdf) |

Every push to the `main` branch on GitHub redeploys the live site on Vercel automatically, usually within a minute or two.

## Tech stack and architecture

The site is a Next.js app with almost no third-party UI code: the animations are hand-written SVG and canvas driven by GSAP, and the backend is three small server pieces on Vercel.

| Layer | Choice | Used for |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript | Pages, server routes, server actions, caching |
| Styling | Tailwind CSS v4 + a hand-written globals.css | Layout, colours, the blog's article styles |
| Fonts | Archivo (wide, heavy), Inter, JetBrains Mono via Fontsource | Big headings, body text, small labels |
| Animation | GSAP 3.15: ScrollTrigger, SplitText, ScrambleText, ScrollTo + @gsap/react | Scroll-scrubbed timelines, pinning, text effects, smooth menu scrolling |
| Drawing | SVG paths (the thread) and HTML canvas (clock, hero figure) | All custom visuals |
| Sound | Web Audio API | Optional looping ambient music + hover/click blips |
| Email | Resend API (plain fetch, no package) | Contact form delivery |
| Database | Neon Postgres via Vercel (@neondatabase/serverless) | Blog posts |
| Markdown | marked | Rendering blog posts |
| Hosting | Vercel (auto-deploy from GitHub) | Live site + server functions |
| Testing | Playwright (browser checks), PGlite (in-memory Postgres), tsx | Visual checks, SQL and login tests |

Colours: black background, pink-red accent #f43f5e, beige #efe9dd for the light sections and cream #fdf8f4 for the clock card.

**How the code is organised**

- `src/app/page.tsx` — the homepage, which stacks the sections in order.
- `src/components/` — one component per section (Hero, FunnelSection, WorkSection, AboutSection, PhotoAccordionMarquee, ContactSection) plus Nav, Loader, sound controls.
- `src/lib/thread/` — the thread engine: path geometry, routes for each section, shared settings.
- `src/app/api/contact/` — the contact-form server route.
- `src/app/blog/`, `src/app/admin/`, `src/lib/blog/` — the blog, its admin and its database and login code.
- `scripts/` — self-check tests (`npm run test:contact`, `npm run test:blog`).

## What's on the site, section by section

The homepage is a loading screen plus six sections, in this order, with a separate blog alongside.

1. **Loading screen** — greetings in several languages (Hello, Bonjour, Hola…) fade through, then the screen lifts and the thread starts drawing. A refresh always starts at the top, with no `#section` left in the address.
2. **Hero ("I am Sourav Mallick")** — the name stretched to fill its column, the glowing tagline "and I am not perfect", and the thread weaving through and behind the letters, ending in a ring.
   - Right side: a canvas head-and-shoulders figure made of about 560 fine threads; it sits as a tangled ball and forms the figure on hover (on phones: when scrolled into view, or by tap).
   - "Click to enable sound" cursor: only over this section; a click here starts the ambient music.
3. **Approach (beige)** — "From complex ideas to simple experiences". The section sticks for 2.7 screens while the thread tangles (raw data), flows through a funnel (pipeline) and splits into three outputs (Projects, Workflows, Visualizations).
4. **Projects** — a split screen: on the left a sticky cream card with the live **tentacle clock** (India time, a tentacle grows to each second's label every second); on the right the project cards slide in, moving at about half the scroll speed so the section lasts longer. A perfectly even pink helix coils down the gap between them.
   - Projects shown: Order Lifecycle Integrity System, AI Summarizer Pro, Video Conferencing App (from the resume), plus two marked sample projects. Images are drawn mock screenshots.
5. **About me** — pinned while one scrubbed animation plays: the thread writes "Scroll" in cursive between the text and the photo, the headline "Data · AI · Systems" decodes from random glyphs, the bio slides up line by line, the photo opens as a growing circle, and three stats count up.
6. **Gallery** — an endless strip of eight generated artworks drifting right to left. Hover (or focus, or tap) widens a photo, gives it its colour back and shows its caption; the strip glides to a stop and the thread drops from a dot to draw a frame around it.
7. **Let's connect** — "Got something in your mind? Let's connect." On the right a tangled thread hangs with a swaying ring; pull it (or click "Pull to untangle" or "Let's talk") and the thread straightens and the contact form opens. Closing the form springs it back into a knot. Footer: back to top, GitHub, LinkedIn, Instagram, email.

**Around the page**

- **Header** — "SM" logo, a menu pill (About, Projects, Resume, Blog) that turns into a music "dynamic island" with a waveform when sound plays, and a "Let's Connect" button. Fully transparent while scrolling. Menu links glide slowly (1.2–2.8 s); About lands at the end of its animation; Resume opens the PDF in a new tab.
- **Favicon** — Sourav's circular portrait.
- **Blog** — a quiet reading page at /blog with posts grouped by year, and post pages with reading time; written in a private editor at /admin (see Backend).

**Built for every visitor**

- Phones get simpler versions: no pinning, plain on-enter animations, no thread where it would not fit, taps instead of hover.
- With "reduce motion" turned on in the device settings, everything shows finished, without animation.
- Sideways scrolling is locked off, and the colours are locked so dark-mode browsers (including Brave's Night Mode) can't repaint them.

## The pink thread

The signature of the site is one pink line (#f43f5e) that appears to run unbroken from the hero to the contact form, drawing itself as you scroll. In fact each section has its own thread, and they meet exactly at shared points on the section edges.

&#91;embedded content: the thread's path through the page · 6 sections\]

**How it works**

- **Shape:** each thread is a list of points (loops, coils, springs, a funnel, the cursive word "Scroll") smoothed into one SVG curve.
- **Drawing:** the curve is revealed by moving its stroke dash in step with the scroll (GSAP ScrollTrigger), with a small glowing tip at the drawing end.
- **Over and under:** in the hero the thread is drawn twice, in front of and behind the text, with masks that hide the front copy where it should tuck behind a letter.
- **Hand-offs:** where two sections meet, both threads start and end at the same x position with a vertical direction, so the join is invisible.
- **Phones and reduced motion:** the long threads are desktop-only; with reduced motion they show fully drawn.

## Backend: contact form and blog

Two features run on the server: a contact form that emails Sourav, and a blog only he can write. Both are deliberately small, with no extra frameworks.

**Contact form** (`/api/contact`)

- The "Let's talk" form posts the visitor's name, email and message to a server route.
- The route checks lengths and the email format, drops spam bots through a hidden field only bots fill in, and sends the message as plain text through Resend, with Reply-To set to the visitor.
- If email isn't configured, the form falls back to opening the visitor's own mail app, so it never breaks.
- Settings: `RESEND_API_KEY`, `CONTACT_TO`.

**Blog** (`/blog`, `/admin`)

- **Reading:** `/blog` lists published posts by year; `/blog/<address>` shows one post rendered from Markdown with date and reading time. Pages are cached for speed and refreshed the moment a post is saved.
- **Writing:** `/admin` asks for a single password, then shows all posts (drafts and published), an editor with Markdown on the left and a live preview on the right, a Published switch, delete and log out.
- **Login:** the password lives only in the `ADMIN_PASSWORD` secret. A correct login sets a cookie signed with `SESSION_SECRET` (32+ characters) that scripts can't read, is sent only to this site, and expires after 7 days. Every admin page and every save or delete checks it.
- **Database:** posts are one Postgres table on Neon (`DATABASE_URL`), created automatically on first use. Each post keeps its first publish date when edited, and two posts can't share an address.
- **Tests:** `npm run test:blog` runs the real SQL on an in-memory Postgres and checks the login token (expiry, tampering, wrong secret); `npm run test:contact` checks the contact route's validation.

## Difficulties faced and how they were solved

Most problems came from three places: keeping one continuous thread across very different sections, keeping heavy animation smooth, and the behaviour of real phones and browsers.

| Area | Problem | What fixed it |
| --- | --- | --- |
| Loading | The loading screen took about 7 s: measuring the thread path point by point (1,300 calls, done twice) blocked the page | A fast custom path sampler, building the path once, and greetings that no longer wait on it |
| Loading | The page opened slightly scrolled down after the loader | Scroll forced to the top, browser scroll restoration turned off, stable scrollbar space |
| Thread | The intro looked static instead of drawing through the letters | Fixed an off-by-one in the draw schedule so the line animates every step |
| Thread | The end ring didn't appear; the thread from section 2 to 3 never drew | Corrected the finish thresholds; the scroll animation now runs to the end of every branch and tail |
| Thread | The hero and Approach threads didn't connect | A shared hand-off point at the section edge with matching vertical tangents |
| Thread | Too tangled to read compared with the reference site | Rebuilt the hero path from Sourav's hand sketch, with a thicker stroke |
| Performance | The hero figure dropped the page to about 7 frames a second | 2,100 strokes per frame batched into 16, capped at 30 fps, lower canvas resolution, 560 threads — back to 30 fps |
| Performance | The slowed-down project cards jittered | Moved the drift from JavaScript to a CSS scroll-driven animation, which moves in step with the scroll |
| Layout | Sideways scrolling on desktop and phones | Clipped overflow at the page edge (and a stronger lock for iPhone Safari); card panel clips its sliding cards |
| Layout | "Got something" hidden under the header; headline wrapping | Headline sized to the screen, "in your mind?" kept on one line |
| Phones | Hover doesn't exist on touch screens | Tap to toggle, form-on-scroll for the hero figure, taps lifted above overlapping text |
| Colours | The clock card and beige turned brown on an iPhone | Brave's Night Mode (Dark Reader) repainted the page; added a darkreader-lock tag and a light-only colour scheme |
| Sound | Browsers block audio until the visitor interacts | Music starts on the first click or tap; the prompt shows only in the hero |
| Hosting | Netlify couldn't be set up from the workspace (rate limit, blocked network) | Sourav linked the repo; Netlify builds were later switched off with one config line |
| Next.js 16 | New caching rules: reading the time or cookies during prerender, page type helpers | `connection()` before reading the clock, Suspense around per-request parts, types generated by the build |
| Blog login | "Login isn't set up yet" after adding secrets | The session secret was under 32 characters; the error now names the exact setting |
| Process | The wanted soundtrack ("I Ain't Worried") is a commercial song and can't be bundled | A generated placeholder ambient loop; swap in a licensed track later |

## Deployment and settings

The live site deploys from GitHub to Vercel on every push to `main`; nothing is uploaded by hand.

1. Code is edited and checked locally: lint, a production build, the self-check tests, and Playwright screenshots at desktop and iPhone sizes.
2. The change is committed and pushed to [Franky1107/PortfolioNEXT](https://github.com/Franky1107/PortfolioNEXT).
3. Vercel builds and publishes it, usually within 1–2 minutes. Changes to settings only apply after a redeploy.

Netlify also hosted a copy for comparison; its builds are now switched off (`ignore = "exit 0"` in `netlify.toml`), so that copy is frozen.

**Vercel settings the site needs** (Settings → Environment Variables, as Secret)

| Setting | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends contact-form email through Resend |
| `CONTACT_TO` | Where contact messages go (souravmallick900@gmail.com) |
| `DATABASE_URL` | Neon Postgres for the blog (added automatically by the Neon connection) |
| `ADMIN_PASSWORD` | The blog admin password (long; 4–5 random words works well) |
| `SESSION_SECRET` | Signs the admin login cookie; 32+ characters; changing it logs everyone out |

## Open items

The site is complete and live; these are the placeholders and loose ends still to finish.

- [ ] Replace the About me stats (40+ pipelines, 12 models, 8 TB moved) with real numbers
- [ ] Replace the two sample projects (Pulse, Knowledge Graph Explorer) and the drawn mock screenshots with real ones; add GitHub or demo links to each card
- [ ] Swap the Gallery's generated artworks for real photos in `/public/gallery`
- [ ] Lengthen `SESSION_SECRET` to 32+ characters, redeploy, and write the first blog post at /admin
- [ ] Send a test message through the contact form to confirm Resend delivers it
- [ ] Point or remove the Workflows and Visualizations items in the Approach section (their sections were replaced)
- [ ] Optional: a licensed soundtrack, a rate limit on /admin/login, and a logo that turns dark over beige sections
