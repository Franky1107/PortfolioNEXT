"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { THREAD } from "@/lib/thread/config";

/* ------------------------------------------------------------------
   CONTENT — edit everything here (or pass a `content` prop).
   ------------------------------------------------------------------ */
export type AboutStat = {
  value: number; // the number the counter lands on
  plus?: boolean; // show a "+" once the counter has finished
  unit?: string; // text right after the number, e.g. "TB"
  label: string; // the line under the number
};

export type AboutContent = {
  eyebrow: string;
  headline: string;
  bio: string;
  photo: { src: string; alt: string };
  stats: AboutStat[];
};

export const ABOUT: AboutContent = {
  eyebrow: "( About me )",
  headline: "Data · AI · Systems",
  bio: "I’m Sourav — a software engineer who likes turning messy, complex data into things people can actually use. My work sits where data engineering, AI and intelligent systems meet: building the pipelines that move and shape data, and the applications that make sense of it. And I am not perfect — I’m still learning, and I enjoy that part the most.",
  photo: { src: "/about.jpg", alt: "Portrait of Sourav Mallick" },
  // PLACEHOLDER numbers — replace with your real ones
  stats: [
    { value: 40, plus: true, label: "pipelines" },
    { value: 12, label: "models" },
    { value: 8, unit: "TB", label: "moved" },
  ],
};

const RING_R = 12; // end-ring radius (px)

/** glyphs the headline scrambles through before it settles */
const GLYPHS = "!<>-_/[]{}=+*01";

/** a same-length string of random glyphs (spaces kept), so the line width barely moves */
const scrambled = (text: string) =>
  text.replace(/\S/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);

/* ------------------------------------------------------------------
   ABOUT ME
   Desktop: the section pins while one scrubbed timeline plays —
     1. headline decodes from random glyphs
     2. bio lines slide up out of their masks + the photo opens as a circle
     3. the stats count up
   Phones: no pinning; each part plays once as it scrolls into view.
   Reduced motion: nothing animates.
   The server-rendered HTML is the finished state, so it's fully readable
   without JavaScript; hidden "before" states are only ever set by GSAP.
   ------------------------------------------------------------------ */
export default function AboutSection({ content = ABOUT }: { content?: AboutContent }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const q = <T extends Element = HTMLElement>(sel: string) => Array.from(section.querySelectorAll<T & Element>(sel)) as T[];

      const headline = q("[data-about-headline]")[0];
      const bio = q("[data-about-bio]")[0];
      const photo = q("[data-about-photo]")[0];
      const photoImg = q("[data-about-photo-img]")[0];
      const stats = q("[data-about-stat]");
      const statsRow = q("[data-about-stats]")[0];
      const eyebrow = q("[data-about-eyebrow]")[0];
      const tailPath = q<SVGPathElement>("[data-about-tail]")[0];
      const tailRing = q<SVGGElement>("[data-about-ring]")[0];

      /* The pink thread arrives from the "Scroll" band above and ends in a
         ring just above the eyebrow (desktop only). */
      let tailLen = 0;
      const layoutTail = () => {
        const s = section.getBoundingClientRect();
        const e = eyebrow.getBoundingClientRect();
        const x = e.left - s.left + 10; // same x the band's thread leaves at
        const ringY = e.top - s.top - 26;
        tailPath.setAttribute("d", `M${x},0 L${x},${ringY - RING_R}`);
        tailRing.setAttribute("transform", `translate(${x} ${ringY})`);
        tailLen = tailPath.getTotalLength();
        tailPath.style.strokeDasharray = `${tailLen} ${tailLen + 20}`;
      };
      const drawTail = (p: number) => {
        tailPath.style.strokeDashoffset = String(tailLen * (1 - p));
        tailPath.style.visibility = p > 0.002 ? "visible" : "hidden";
        tailRing.classList.toggle("is-on", p > 0.995);
      };

      const mm = gsap.matchMedia();

      // reduced motion on desktop: the thread is simply there, fully drawn
      mm.add("(min-width: 768px) and (prefers-reduced-motion: reduce)", () => {
        layoutTail();
        drawTail(1);
        const onResize = () => layoutTail();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      });

      mm.add(
        {
          desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          const desktop = Boolean(ctx.conditions?.desktop);

          /* --- building blocks ---------------------------------------- */
          // headline starts as same-length glyphs; the cleanup below restores it
          headline.textContent = scrambled(content.headline);
          const scramble = (vars: gsap.TweenVars = {}) =>
            gsap.to(headline, {
              duration: 1.2,
              ease: "none",
              scrambleText: { text: content.headline, chars: GLYPHS, revealDelay: 0.2, speed: 0.6, tweenLength: false },
              ...vars,
            });

          const photoReveal = () =>
            gsap
              .timeline()
              .fromTo(photo, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.1, ease: "power2.inOut" }, 0)
              .fromTo(photoImg, { scale: 1.2 }, { scale: 1, duration: 1.1, ease: "power2.out" }, 0);

          const counters = () => {
            const tl = gsap.timeline();
            stats.forEach((stat, i) => {
              const s = content.stats[i];
              const num = stat.querySelector<HTMLElement>("[data-about-num]")!;
              const plus = stat.querySelector<HTMLElement>("[data-about-plus]");
              const proxy = { v: 0 };
              num.textContent = "0";
              tl.to(
                proxy,
                {
                  v: s.value,
                  duration: 1,
                  ease: "power3.out",
                  snap: { v: 1 },
                  onUpdate: () => {
                    num.textContent = String(proxy.v);
                  },
                },
                i * 0.12,
              );
              if (plus) tl.fromTo(plus, { autoAlpha: 0, y: "0.25em" }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, ">-0.15");
            });
            return tl;
          };

          const linesUp = (lines: Element[], vars: gsap.TweenVars = {}) =>
            gsap.from(lines, { yPercent: 110, duration: 0.6, stagger: 0.12, ease: "power3.out", ...vars });

          /* --- desktop: one pinned, scrubbed timeline ------------------ */
          // The bio is split into masked lines. autoSplit re-splits it whenever
          // its width changes (resize, late fonts) so lines never break wrong;
          // the timeline returned from onSplit is rebuilt each time and keeps
          // its progress.
          SplitText.create(bio, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              if (desktop) {
                const tl = gsap.timeline({
                  defaults: { ease: "none" },
                  scrollTrigger: {
                    trigger: section,
                    start: "top top",
                    end: "+=200%",
                    pin: true,
                    scrub: 0.8,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                  },
                });
                tl.add(scramble())
                  .addLabel("reveal", "+=0.1")
                  .add(linesUp(self.lines), "reveal")
                  .add(photoReveal(), "reveal")
                  .add(counters(), ">+0.05")
                  .to({}, { duration: 0.35 }); // short hold before the pin releases
                return tl;
              }
              // phones: the bio plays on its own as it enters
              return linesUp(self.lines, { duration: 0.8, scrollTrigger: { trigger: bio, start: "top 85%", once: true } });
            },
          });

          /* --- desktop: the thread's tail draws as the section scrolls up,
                 finishing (ring and all) just before the pin starts ------ */
          if (desktop) {
            ScrollTrigger.create({
              trigger: section,
              start: "top bottom",
              end: "top 12%",
              scrub: true,
              onRefresh: (self) => {
                layoutTail();
                drawTail(self.progress);
              },
              onUpdate: (self) => drawTail(self.progress),
            });
          }

          /* --- phones: each piece plays once as it scrolls in ---------- */
          if (!desktop) {
            scramble({ scrollTrigger: { trigger: headline, start: "top 88%", once: true } });
            gsap.timeline({ scrollTrigger: { trigger: photo, start: "top 80%", once: true } }).add(photoReveal());
            gsap.timeline({ scrollTrigger: { trigger: statsRow, start: "top 90%", once: true } }).add(counters());
          }

          // put the finished text back when this version is torn down
          // (breakpoint change, reduced-motion switch, unmount)
          return () => {
            drawTail(0);
            headline.textContent = content.headline;
            stats.forEach((stat, i) => {
              const num = stat.querySelector<HTMLElement>("[data-about-num]");
              if (num) num.textContent = String(content.stats[i].value);
            });
          };
        },
      );
    },
    { scope: root, dependencies: [content] },
  );

  return (
    <section
      ref={root}
      id="about"
      className="relative flex min-h-[100svh] items-center overflow-hidden border-t border-white/10 px-5 py-20 md:px-[3vw] md:pb-[4svh] md:pt-[calc(72px+4svh)]"
    >
      {/* the thread's last stretch + its end ring (desktop) */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block">
        <path data-about-tail fill="none" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} strokeLinecap="round" style={{ visibility: "hidden" }} />
        <g data-about-ring>
          <g className="thread-ring">
            <circle r={RING_R} fill="var(--ink)" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} />
            <circle r={4} fill="var(--accent)" />
          </g>
        </g>
      </svg>

      <div className="relative grid w-full grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-[5vw]">
        {/* LEFT — headline, bio, stats */}
        <div className="flex min-w-0 flex-col">
          <p data-about-eyebrow className="self-start font-mono text-[11px] uppercase tracking-[0.14em] text-accent md:text-[12px]">
            {content.eyebrow}
          </p>

          <h2 aria-label={content.headline} className="type-heavy mt-4 whitespace-nowrap text-[8.4vw] leading-[0.95] md:text-[length:min(4.6vw,9svh)]">
            <span data-about-headline aria-hidden>
              {content.headline}
            </span>
          </h2>

          <p data-about-bio className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-white/75 md:mt-[min(2.6vw,4.5svh)] md:text-[length:clamp(1rem,1.35vw,1.4rem)]">
            {content.bio}
          </p>

          <dl data-about-stats className="mt-10 grid grid-cols-3 border-t border-white/15 md:mt-[min(3.6vw,6svh)]">
            {content.stats.map((s) => (
              <div key={s.label} data-about-stat className="pr-3 pt-5">
                <dt className="sr-only">{s.label}</dt>
                <dd className="type-heavy flex items-baseline text-[9vw] leading-none md:text-[length:min(4vw,8svh)]">
                  <span data-about-num className="inline-block text-left tabular-nums" style={{ minWidth: `${String(s.value).length}ch` }}>
                    {s.value}
                  </span>
                  {s.unit && <span className="ml-[0.15em]">{s.unit}</span>}
                  {s.plus && (
                    <span data-about-plus className="inline-block text-accent">
                      +
                    </span>
                  )}
                </dd>
                <dd aria-hidden className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50 md:text-[12px]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* RIGHT — photo (on phones it sits above the text) */}
        <figure
          data-about-photo
          className="relative order-first aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#0d0d0d] md:order-none md:w-[min(31vw,60svh)]"
        >
          <div data-about-photo-img className="absolute inset-0">
            <Image src={content.photo.src} alt={content.photo.alt} fill sizes="(min-width: 768px) 31vw, 100vw" className="object-cover object-[50%_20%]" />
          </div>
        </figure>
      </div>
    </section>
  );
}
