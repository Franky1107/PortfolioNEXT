"use client";

/**
 * <Thread>
 * --------
 * Wrap your page in <Thread>…</Thread>. It:
 *   1. measures every element marked data-thread="…" (getBoundingClientRect)
 *   2. asks each segment (src/lib/thread/segments.ts) for its points
 *   3. draws one continuous SVG thread in two layers:
 *        • BACK layer  – behind your content (the thread goes "under" text)
 *        • FRONT layer – in front of the content, except inside the `under`
 *          rectangles (where the thread should look tucked behind a letter)
 *   4. links drawing to scroll with GSAP ScrollTrigger (scrub: true),
 *      so it draws as you scroll down and retracts as you scroll up
 *   5. rebuilds whenever the layout changes size
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { THREAD } from "@/lib/thread/config";
import { clamp, moveTo, smoothCommands } from "@/lib/thread/geometry";
import { SEGMENTS } from "@/lib/thread/segments";
import type { Box, Branch, Connector, Pt, Segment } from "@/lib/thread/types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Geometry = {
  width: number;
  height: number;
  mobile: boolean;
  start: Pt;
  commands: string[];
  d: string;
  markers: Record<string, number>;
  under: Box[];
  rings: Pt[];
  connectors: Connector[];
  node?: { at: Pt; r: number };
  branches: Branch[];
};

type Props = {
  children: React.ReactNode;
  /** The route. Defaults to SEGMENTS from src/lib/thread/segments.ts */
  segments?: Segment[];
};

export default function Thread({ children, segments = SEGMENTS }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  // intro progress (0 → 1); kept across rebuilds so it only plays once
  const introRef = useRef({ p: 0 });
  const nodeRef = useRef<SVGGElement>(null);
  const branchRefs = useRef<(SVGPathElement | null)[]>([]);
  const branchDotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const connectorRefs = useRef<(SVGGElement | null)[]>([]);
  const [geo, setGeo] = useState<Geometry | null>(null);

  /* ---------------------------------------------------------------- */
  /* 1. MEASURE the page and build the path                            */
  /* ---------------------------------------------------------------- */
  const build = useCallback(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;

    const rr = root.getBoundingClientRect();
    const toBox = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      const left = r.left - rr.left;
      const top = r.top - rr.top;
      return {
        left,
        top,
        right: left + r.width,
        bottom: top + r.height,
        width: r.width,
        height: r.height,
        cx: left + r.width / 2,
        cy: top + r.height / 2,
      };
    };
    const ctx = {
      width: rr.width,
      height: content.offsetHeight,
      mobile: window.innerWidth < THREAD.mobileBreakpoint,
      box: (n: string) => {
        const el = root.querySelector(`[data-thread="${n}"]`);
        return el ? toBox(el) : null;
      },
      boxes: (n: string) => Array.from(root.querySelectorAll(`[data-thread="${n}"]`)).map(toBox),
    };

    const points: Pt[] = [];
    const markers: Record<string, number> = {};
    const under: Box[] = [];
    const rings: Pt[] = [];
    const connectors: Connector[] = [];
    let node: Geometry["node"];
    let branches: Branch[] = [];

    for (const seg of segments) {
      const res = seg(ctx);
      if (!res || !res.points.length) continue;
      const offset = points.length;
      points.push(...res.points);
      for (const [k, i] of Object.entries(res.markers ?? {})) markers[k] = offset + i;
      under.push(...(res.under ?? []));
      for (const idx of res.rings ?? []) {
        markers[`ring${rings.length}`] = offset + idx;
        rings.push(res.points[idx]);
      }
      connectors.push(...(res.connectors ?? []));
      if (res.node) node = res.node;
      if (res.branches) branches = res.branches;
    }
    if (points.length < 2) return;

    const commands = smoothCommands(points);
    setGeo({
      width: ctx.width,
      height: ctx.height,
      mobile: ctx.mobile,
      start: points[0],
      commands,
      d: moveTo(points[0]) + commands.join(""),
      markers,
      under,
      rings,
      connectors,
      node,
      branches,
    });
  }, [segments]);

  // Build after fonts load, and again whenever the layout changes size.
  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(build);
      }, 120);
    };
    // build straight away, then again once the web fonts have loaded
    build();
    document.fonts?.ready.then(schedule);
    const ro = new ResizeObserver(schedule);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [build]);

  /* ---------------------------------------------------------------- */
  /* 2. ANIMATE — map scroll position → how much thread is drawn       */
  /* ---------------------------------------------------------------- */
  useLayoutEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    const measure = measureRef.current;
    const root = rootRef.current;
    if (!geo || !back || !front || !measure || !root) return;

    const L = back.getTotalLength();
    const step = THREAD.sampleStep;
    const intro = introRef.current;

    // Length of thread at each marker (exact: measure the path up to that point)
    const markerLen: Record<string, number> = {};
    for (const [id, idx] of Object.entries(geo.markers)) {
      measure.setAttribute("d", moveTo(geo.start) + geo.commands.slice(0, idx).join(""));
      markerLen[id] = measure.getTotalLength();
    }

    // Sample the path so we can find the tip position cheaply while scrolling
    const n = Math.ceil(L / step);
    const xs = new Float32Array(n + 1);
    const ys = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const p = back.getPointAtLength(Math.min(i * step, L));
      xs[i] = p.x;
      ys[i] = p.y;
    }

    // The intro part (the hero) is drawn on page load, not by scrolling
    const introLen = Math.min(L, markerLen[THREAD.introMarker] ?? 0);

    // Scroll schedule: sample i is fully drawn when the page has scrolled sched[i] px.
    // The tip runs THREAD.followAt of the way down the screen, so each part is
    // finished while it is still visible. Dense parts (the tangle) get at least
    // THREAD.minScrollPerPx scroll per px of thread so they don't flash past.
    const rootTop = root.getBoundingClientRect().top + window.scrollY;
    const follow = window.innerHeight * THREAD.followAt;
    const sched = new Float32Array(n + 1);
    let prev = 0;
    for (let i = 0; i <= n; i++) {
      const target = rootTop + ys[i] - follow;
      if (i * step <= introLen + step) prev = 0;
      else prev = Math.max(prev + step * THREAD.minScrollPerPx, target);
      sched[i] = prev;
    }
    let bStart = prev;
    const lowestEnd = Math.max(0, ...geo.branches.map((b) => b.end.y));
    let bEnd = Math.max(bStart + THREAD.branchScroll, rootTop + lowestEnd - follow);

    // Make sure everything finishes before the page runs out of scroll
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (bEnd > maxScroll) {
      const k = maxScroll / bEnd;
      for (let i = 0; i <= n; i++) sched[i] *= k;
      bStart *= k;
      bEnd = maxScroll;
    }

    const lengthAt = (s: number) => {
      if (s < sched[0]) return 0;
      if (s >= sched[n]) return L;
      let lo = 0;
      let hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (sched[mid] <= s) lo = mid;
        else hi = mid;
      }
      const span = sched[hi] - sched[lo] || 1;
      return Math.min(L, (lo + (s - sched[lo]) / span) * step);
    };

    // DOM we update every frame
    const labels = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-thread-label]").forEach((el) => labels.set(el.dataset.threadLabel!, el));
    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-thread-reveal]"));
    const branchEls = branchRefs.current.slice(0, geo.branches.length);
    const branchLens = branchEls.map((el) => el?.getTotalLength() ?? 0);

    for (const p of [back, front]) p.style.strokeDasharray = `${L} ${L + 20}`;
    branchEls.forEach((el, i) => el && (el.style.strokeDasharray = `${branchLens[i]} ${branchLens[i] + 20}`));

    let lastS = 0;
    const render = (s: number, full = false) => {
      lastS = s;
      const scrolled = lengthAt(s);
      // during the intro, the hero part grows on its own; scrolling past it takes over
      const len = full ? L : scrolled > introLen + 1 ? scrolled : Math.min(scrolled, introLen * intro.p);
      const off = String(L - len);
      const vis = len > 0.5 ? "visible" : "hidden";
      for (const p of [back, front]) {
        p.style.strokeDashoffset = off;
        p.style.visibility = vis;
      }

      // ◎ ring-dots appear as the thread reaches them
      geo.rings.forEach((_, i) => {
        const el = ringRefs.current[i];
        if (el) el.style.opacity = len >= Math.max(0.5, (markerLen[`ring${i}`] ?? Infinity) - 3) ? "1" : "0";
      });

      // glowing tip
      const tip = tipRef.current;
      if (tip) {
        if (len > 0.5 && len < L - 0.5) {
          const fi = len / step;
          const i = Math.min(n - 1, Math.floor(fi));
          const t = fi - i;
          const x = xs[i] + (xs[i + 1] - xs[i]) * t;
          const y = ys[i] + (ys[i + 1] - ys[i]) * t;
          tip.setAttribute("transform", `translate(${x} ${y})`);
          tip.style.opacity = "1";
        } else tip.style.opacity = "0";
      }

      // labels + leader lines fade in once the thread reaches them
      // (a marker at the very end of the thread starts fading in just before it)
      const fadeAt = (id: string) => Math.min(markerLen[id] ?? Infinity, L - THREAD.labelFade);
      geo.connectors.forEach((c, i) => {
        const o = clamp((len - fadeAt(c.id)) / THREAD.labelFade);
        const line = connectorRefs.current[i];
        if (line) line.style.opacity = String(o);
      });
      labels.forEach((el, id) => {
        const o = clamp((len - fadeAt(id)) / THREAD.labelFade);
        el.style.opacity = String(o);
      });

      // Insight node lights up when the thread arrives
      nodeRef.current?.classList.toggle("is-lit", len >= L - 1);

      // three branches draw together after the main thread
      const b = full ? 1 : clamp((s - bStart) / (bEnd - bStart || 1));
      branchEls.forEach((el, i) => {
        if (!el) return;
        el.style.strokeDashoffset = String(branchLens[i] * (1 - b));
        el.style.visibility = b > 0 ? "visible" : "hidden";
        const dot = branchDotRefs.current[i];
        if (dot) dot.style.opacity = b > 0.97 ? "1" : "0";
      });
      reveals.forEach((el) => (el.style.opacity = String(0.35 + 0.65 * clamp((b - 0.7) / 0.3))));
    };

    // Respect reduced-motion: show everything, fully drawn, no animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      intro.p = 1;
      render(0, true);
      return;
    }

    const proxy = { s: 0 };
    const tween = gsap.to(proxy, {
      s: bEnd,
      ease: "none",
      onUpdate: () => render(proxy.s),
      scrollTrigger: { start: 0, end: bEnd, scrub: true },
    });

    // Intro: draw the hero part once, shortly after the page loads
    let introTween: gsap.core.Tween | undefined;
    if (intro.p < 1) {
      introTween = gsap.to(intro, {
        p: 1,
        duration: THREAD.introDuration,
        delay: intro.p === 0 ? 0.15 : 0,
        ease: "power2.inOut",
        onUpdate: () => render(lastS),
      });
    }
    render(Math.min(window.scrollY, bEnd));

    return () => {
      introTween?.kill();
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [geo]);

  /* ---------------------------------------------------------------- */
  /* 3. RENDER — back layer, your content, front layer                 */
  /* ---------------------------------------------------------------- */
  const stroke = geo?.mobile ? THREAD.strokeWidthMobile : THREAD.strokeWidth;
  const svgProps = geo && {
    width: geo.width,
    height: geo.height,
    viewBox: `0 0 ${geo.width} ${geo.height}`,
    "aria-hidden": true,
    className: "pointer-events-none absolute left-0 top-0",
  };
  const threadStyle = {
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    visibility: "hidden" as const,
  };

  return (
    <div ref={rootRef} className="relative overflow-x-clip">
      {/* BACK LAYER — behind the content */}
      {geo && svgProps && (
        <svg {...svgProps} style={{ zIndex: 0 }}>
          <path ref={backRef} d={geo.d} style={threadStyle} />
          <path ref={measureRef} d="" style={{ fill: "none", stroke: "none" }} />
        </svg>
      )}

      {/* CONTENT */}
      <div ref={contentRef} className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>

      {/* FRONT LAYER — over the content */}
      {geo && svgProps && (
        <svg {...svgProps} style={{ zIndex: 20 }}>
          <defs>
            {/* white = draw the thread in front; black = hide it (it shows only behind the letters) */}
            <mask id="thread-front" maskUnits="userSpaceOnUse" x={0} y={0} width={geo.width} height={geo.height}>
              <rect width={geo.width} height={geo.height} fill="white" />
              {geo.under.map((b, i) => (
                <rect key={i} x={b.left} y={b.top} width={b.width} height={b.height} fill="black" />
              ))}
            </mask>
            <radialGradient id="thread-glow">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* the same thread in front of the content, except where it tucks behind a letter */}
          <path ref={frontRef} d={geo.d} style={threadStyle} mask="url(#thread-front)" />

          {/* leader lines to the labels */}
          {geo.connectors.map((c, i) => (
            <g
              key={c.id}
              ref={(el) => {
                connectorRefs.current[i] = el;
              }}
              style={{ opacity: 0 }}
            >
              <line x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y} stroke="white" strokeOpacity={0.55} strokeWidth={1} />
              <circle cx={c.to.x} cy={c.to.y} r={2.5} fill="white" />
            </g>
          ))}

          {/* the Insight node */}
          {geo.node && (
            <g ref={nodeRef} className="thread-node" transform={`translate(${geo.node.at.x} ${geo.node.at.y})`}>
              <circle className="glow" r={geo.node.r * 3.2} fill="url(#thread-glow)" />
              <circle className="ring" r={geo.node.r} fill="black" stroke="var(--accent)" strokeWidth={1.6} />
              <circle className="core" r={geo.node.r * 0.32} fill="white" />
            </g>
          )}

          {/* three branches + their end dots */}
          {geo.branches.map((b, i) => (
            <g key={i}>
              <path
                ref={(el) => {
                  branchRefs.current[i] = el;
                }}
                d={b.d}
                style={threadStyle}
              />
              <circle
                ref={(el) => {
                  branchDotRefs.current[i] = el;
                }}
                cx={b.end.x}
                cy={b.end.y}
                r={3.2}
                fill="var(--accent)"
                style={{ opacity: 0, transition: "opacity .25s" }}
              />
            </g>
          ))}

          {/* glowing dot at the leading tip */}
          <g ref={tipRef} style={{ opacity: 0 }}>
            <circle r={18} fill="url(#thread-glow)" />
            <circle r={3.6} fill="white" />
          </g>
          {/* ◎ ring-dots (start and end of the hero thread) */}
          {geo.rings.map((p, i) => (
            <g
              key={i}
              ref={(el) => {
                ringRefs.current[i] = el;
              }}
              transform={`translate(${p.x} ${p.y})`}
              style={{ opacity: 0, transition: "opacity .2s" }}
            >
              <circle r={stroke * 3.2} fill="black" stroke="var(--accent)" strokeWidth={stroke * 0.75} />
              <circle r={stroke * 1.1} fill="var(--accent)" />
            </g>
          ))}

        </svg>
      )}
    </div>
  );
}
