"use client";

/**
 * "SCROLL" BAND
 * -------------
 * Between the work section and About me (desktop only). The pink thread drops
 * in from the helix above, writes the word "Scroll" in one cursive stroke,
 * then sweeps down to the bottom-left, where the About section picks it up.
 *
 *   1. as the band scrolls up into view → the thread drops in to the "S"
 *   2. the band pins for a moment     → the word writes itself as you scroll
 *   3. still pinned                   → the thread sweeps down to the exit
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { THREAD } from "@/lib/thread/config";
import { moveTo, smoothCommands } from "@/lib/thread/geometry";
import { SCROLL_WORD } from "@/lib/thread/scrollWord";
import type { Pt } from "@/lib/thread/types";

type Geo = { w: number; h: number; d: string; entryD: string };

/** where the thread leaves this band: just left of the About eyebrow (shared with AboutSection) */
export function aboutThreadX(): number | null {
  const eyebrow = document.querySelector<HTMLElement>("#about [data-about-eyebrow]");
  if (!eyebrow) return null;
  return eyebrow.getBoundingClientRect().left + 10;
}

export default function ScrollWordThread() {
  const bandRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const entryRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const lastKey = useRef("");

  /* 1. MEASURE + BUILD the path ------------------------------------- */
  const build = useCallback(() => {
    const band = bandRef.current;
    const left = document.querySelector<HTMLElement>("#projects [data-helix-left]");
    const right = document.querySelector<HTMLElement>("#projects [data-helix-right]");
    const exitAbs = aboutThreadX();
    if (!band || !left || !right || exitAbs === null || window.innerWidth < THREAD.mobileBreakpoint) {
      if (lastKey.current !== "off") {
        lastKey.current = "off";
        setGeo(null);
      }
      return;
    }
    const b = band.getBoundingClientRect();
    const W = b.width;
    const H = b.height;
    const cx = (left.getBoundingClientRect().right + right.getBoundingClientRect().left) / 2 - b.left; // same x as the helix exit
    const exitX = exitAbs - b.left;

    // the word: about half the width, centred, sitting a little above the middle
    const u = Math.min((W * 0.5) / SCROLL_WORD.width, (H * 0.36) / (SCROLL_WORD.bottom - SCROLL_WORD.top));
    const wordX = W / 2 - (SCROLL_WORD.width * u) / 2;
    const base = H * 0.5 + u * 0.9;
    const word = SCROLL_WORD.place(wordX, base, u);
    const end = word[word.length - 1];

    const entry: Pt[] = [{ x: cx, y: 0 }, { x: cx, y: H * 0.07 }, word[0]];
    const sweep: Pt[] = [
      { x: end.x + u * 0.35, y: end.y - u * 0.05 },
      { x: W * 0.62, y: base + u * 0.75 },
      { x: W * 0.24, y: base + u * 0.95 },
      { x: exitX, y: H - H * 0.07 },
      { x: exitX, y: H },
    ];
    const pts = [...entry, ...word.slice(1), ...sweep];
    const cmds = smoothCommands(pts);
    const d = moveTo(pts[0]) + cmds.join("");
    const entryD = moveTo(pts[0]) + cmds.slice(0, entry.length - 1).join("");

    const key = `${W}|${H}|${Math.round(cx)}|${Math.round(exitX)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    setGeo({ w: W, h: H, d, entryD });
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(build, 120);
    };
    build();
    const ro = new ResizeObserver(schedule);
    const projects = document.querySelector("#projects");
    if (projects) ro.observe(projects);
    if (bandRef.current) ro.observe(bandRef.current);
    window.addEventListener("resize", schedule);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [build]);

  /* 2. DRAW ON SCROLL ------------------------------------------------- */
  useLayoutEffect(() => {
    const path = pathRef.current;
    const band = bandRef.current;
    if (!geo || !path || !band) return;
    const total = path.getTotalLength();
    const entryLen = entryRef.current?.getTotalLength() ?? 0;
    path.style.strokeDasharray = `${total} ${total + 20}`;

    let drawnEntry = 0;
    let drawnRest = 0;
    const render = () => {
      const len = Math.min(total, drawnEntry * entryLen + drawnRest * (total - entryLen));
      path.style.strokeDashoffset = String(total - len);
      path.style.visibility = len > 0.3 ? "visible" : "hidden";
      const tip = tipRef.current;
      if (tip) {
        if (len > 0.3 && len < total - 0.5) {
          const q = path.getPointAtLength(len);
          tip.setAttribute("cx", String(q.x));
          tip.setAttribute("cy", String(q.y));
          tip.style.opacity = "1";
        } else tip.style.opacity = "0";
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawnEntry = drawnRest = 1;
      render();
      return;
    }

    const ctx = gsap.context(() => {
      // 1. drop in while the band scrolls up into view (the helix hands over at its top edge)
      ScrollTrigger.create({
        trigger: band,
        start: "top bottom",
        end: "top top",
        scrub: true,
        refreshPriority: 1, // this band sits above About's pin, so measure it first
        onUpdate: (self) => {
          drawnEntry = self.progress;
          render();
        },
      });
      // 2 + 3. pinned: write the word, then sweep down to the exit
      ScrollTrigger.create({
        trigger: band,
        start: "top top",
        end: "+=110%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        refreshPriority: 1,
        onUpdate: (self) => {
          drawnRest = self.progress;
          render();
        },
      });
    }, band);
    ScrollTrigger.refresh();
    render();
    return () => ctx.revert();
  }, [geo]);

  return (
    <div ref={bandRef} data-scroll-band aria-hidden className="relative hidden h-[100svh] overflow-hidden md:block">
      {geo && (
        <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} className="pointer-events-none absolute left-0 top-0">
          <path ref={entryRef} d={geo.entryD} style={{ visibility: "hidden" }} fill="none" />
          <path
            ref={pathRef}
            d={geo.d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={THREAD.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ visibility: "hidden" }}
          />
          <circle ref={tipRef} r={3.6} fill="var(--accent)" style={{ opacity: 0 }} />
        </svg>
      )}
    </div>
  );
}
