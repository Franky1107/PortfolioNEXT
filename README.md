# PortfolioNEXT — Sourav Mallick

My portfolio homepage, rebuilt from the Canva design in code. One reddish-pink thread draws itself as you scroll. It weaves through my name and then turns into the data funnel.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · GSAP ScrollTrigger · Vercel

---

## 1. One-time setup (≈10 minutes)

You need two free programs:

1. **Node.js** (runs the project on your computer). Download the **LTS** version from <https://nodejs.org> and install it with the default options.
2. **VS Code** (a code editor). Download it from <https://code.visualstudio.com>.

To check that Node installed correctly, open a terminal. In VS Code, use **Terminal → New Terminal**. Then type:

```bash
node -v
```

You should see a version number such as `v22.x.x`.

## 2. Run the site on your computer

1. Unzip `PortfolioNEXT.zip` somewhere easy to find, for example `Documents/PortfolioNEXT`.
2. In VS Code, choose **File → Open Folder…** and pick that folder.
3. Open the terminal (**Terminal → New Terminal**) and run these commands one at a time:

```bash
npm install        # downloads the libraries (first time only, ~1 min)
npm run dev        # starts the site
```

4. Open <http://localhost:3000> in your browser. Changes you save in VS Code appear there instantly.
5. To stop the site, click in the terminal and press `Ctrl + C`.

### Add your photo

Replace `public/profile.jpg` with your full-resolution black-and-white portrait. Keep the same filename. The current file is a low-resolution crop taken from the Canva mock-up.

## 3. Put it on GitHub (repository: `Franky1107/PortfolioNEXT`)

The repository already exists and contains a README. In the VS Code terminal, inside the project folder, run:

```bash
git init
git add .
git commit -m "Homepage with scroll thread"
git branch -M main
git remote add origin https://github.com/Franky1107/PortfolioNEXT.git
git pull origin main --allow-unrelated-histories   # merges in GitHub's README
git push -u origin main
```

If `git pull` reports a conflict in `README.md`, keep this version of the file. Run `git add README.md` and `git commit`, then run `git push` again.

> Prefer clicking to typing? Install **GitHub Desktop** (<https://desktop.github.com>). Use **File → Add local repository** to add this folder, then click **Publish/Push**.

## 4. Deploy on Vercel (free)

1. Go to <https://vercel.com> and click **Sign up → Continue with GitHub**.
2. Click **Add New… → Project**, find **PortfolioNEXT**, and click **Import**.
3. Leave every setting at its default. Vercel detects Next.js automatically. Click **Deploy**.
4. After about a minute you get a live link, such as `portfolionext.vercel.app`.

Every later `git push` to `main` redeploys the site automatically. To use your own domain, open the project in Vercel and go to **Settings → Domains**.

---

## Project structure

```
PortfolioNEXT/
├─ public/
│  └─ profile.jpg                ← your portrait
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              ← fonts + page <head>
│  │  ├─ page.tsx                ← the homepage: <Thread> wrapping the sections
│  │  └─ globals.css             ← colours (--accent), fonts, node glow animation
│  ├─ components/
│  │  ├─ Nav.tsx                 ← SM logo, grey pill menu, Let's Connect
│  │  ├─ Hero.tsx                ← "I AM / Sourav Mallick", tagline, photo
│  │  ├─ FunnelSection.tsx       ← heading + funnel labels + 3 items
│  │  ├─ NextSections.tsx        ← placeholder Projects/Workflows/… + footer
│  │  ├─ icons.tsx               ← the 3 small item icons
│  │  └─ thread/
│  │     └─ Thread.tsx           ← the reusable thread engine
│  └─ lib/thread/
│     ├─ config.ts               ← ★ tweak timing, thickness, funnel layout here
│     ├─ segments.ts             ← ★ the thread's route (one function per section)
│     ├─ geometry.ts             ← curve maths: smoothing, scribble, wobble, rings
│     └─ types.ts
└─ package.json
```

## How the thread works

1. Elements the thread interacts with carry a `data-thread="…"` attribute, for example `data-thread="iam"`, one per letter of the name, `data-thread="photo"` and `data-thread="funnel"`.
2. `Thread.tsx` measures them with `getBoundingClientRect()`. It does this again whenever the layout changes size.
3. Each **segment** in `segments.ts` turns those measurements into points:
   - **Hero:** starts at "I AM" and weaves through every letter. It swings above and below and alternates **in front of** and **behind** the letters. It never goes right of the photo's left edge, so it can't cross your face. Then it sweeps below the tagline.
   - **Funnel:** a hanging string, then the scribble tangle, the wobbly walls and rings that the thread draws by looping, the neck, and the Insight node. After that come three branches that draw together.
4. All points are smoothed into **one** SVG path. That path is drawn twice:
   - a **back layer** behind the text, where the letters hide it, so it reads as "under";
   - a **front layer** above the text, masked so it shows only on the "over" letters.
5. GSAP ScrollTrigger (`scrub: true`) links scroll position to `stroke-dashoffset`. The thread draws on the way down and retracts on the way up. The tip follows about 62% of the way down the screen.
6. Labels and leader lines fade in when the thread passes them. The node lights up with a glow pulse when the thread arrives.

Built in:

- **Mobile:** the layout stacks vertically and the thread takes gentler curves through every second letter. It runs down the side gutters, past the photo rather than across it, and the funnel is smaller.
- **Reduced motion:** for people who turn animations off in their system settings, the thread appears fully drawn with no animation.
- **Never blocks clicks:** both thread layers use `pointer-events: none`.

## Common tweaks

| I want to…                         | Change                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| Change the thread colour           | `--accent` in `src/app/globals.css`                             |
| Make the thread thicker or thinner | `strokeWidth` in `src/lib/thread/config.ts`                     |
| Make it draw slower or faster      | `minScrollPerPx` and `followAt` in `config.ts`                  |
| Make the tangle messier or calmer  | `FUNNEL.tangle.loops`, `points` or `seed` in `config.ts`        |
| Wobble the funnel walls more       | `FUNNEL.wobble` in `config.ts`                                  |
| Move labels or items               | `FUNNEL.labelX`, `labelY`, `itemDx` and `itemY` in `config.ts`  |
| Change menu links                  | `LINKS` in `src/components/Nav.tsx`                             |
| Change the funnel item links       | `ITEMS` in `src/components/FunnelSection.tsx`                   |
| Use "Unbounded" for the name       | `npm i @fontsource-variable/unbounded`, import it in `layout.tsx`, set `.type-wide`'s font-family |

## Extending the thread into a new section

1. Build the section, for example an About section, inside `<Thread>` in `page.tsx`.
2. Add `data-thread="about-title"` (or any name you like) to the elements the thread should visit.
3. In `src/lib/thread/segments.ts`, write a new segment:

   ```ts
   export const aboutSegment: Segment = (ctx) => {
     const t = ctx.box("about-title");
     if (!t) return null;
     return { points: [{ x: t.left - 20, y: t.top }, { x: t.right + 20, y: t.bottom }] };
   };
   ```

4. Add it to `SEGMENTS` in page order. The node and branches always appear at the end of the thread. To have the thread continue past the funnel, move the node and branches into your last segment.

## Fonts

The fonts are self-hosted through npm, so no requests go to Google:

- **Archivo** (variable width): extra-expanded for the name and normal width for the heavy heading
- **Inter** for body text
- **JetBrains Mono** for labels
