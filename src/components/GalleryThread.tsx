"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { THREAD } from "@/lib/thread/config";

/**
 * GALLERY THREAD (desktop)
 * - The thread arrives from About me at the section's top centre and drops
 *   to a dot just above the photo strip (drawn as you scroll in).
 * - Hover / focus / tap a photo: the thread runs on from the dot down to that
 *   photo and draws a frame around it; leave and it pulls back into the dot.
 * - Past the dot the thread carries on behind the photos to the bottom
 *   centre, where the Let's connect section picks it up.
 * Place it inside a `relative` section that also holds the strip, marked
 * with [data-gallery-strip] (which must sit above z-0).
 */
const PAD = 9; // frame gap around the photo
const R = 22; // frame corner radius
const DOT_GAP = 34; // dot sits this far above the strip

export default function GalleryThread() {
  const svgRef = useRef<SVGSVGElement>(null);
  const dropRef = useRef<SVGPathElement>(null);
  const passRef = useRef<SVGPathElement>(null);
  const frameRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const drop = dropRef.current;
    const pass = passRef.current;
    const frame = frameRef.current;
    const dot = dotRef.current;
    const section = svg?.parentElement;
    const strip = section?.querySelector<HTMLElement>("[data-gallery-strip]");
    if (!svg || !drop || !pass || !frame || !dot || !section || !strip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // where the dot sits (section coordinates)
    const dotPos = () => {
      const s = section.getBoundingClientRect();
      const t = strip.getBoundingClientRect();
      return { x: s.width / 2, y: t.top - s.top - DOT_GAP };
    };

    /* 1. the drop from the top edge to the dot, drawn as the section scrolls in */
    let dropLen = 0;
    let passLen = 0;
    const layoutDrop = () => {
      const d = dotPos();
      drop.setAttribute("d", `M${d.x},0 L${d.x},${d.y}`);
      dropLen = drop.getTotalLength();
      drop.style.strokeDasharray = `${dropLen} ${dropLen + 20}`;
      pass.setAttribute("d", `M${d.x},${d.y} L${d.x},${section.getBoundingClientRect().height}`);
      passLen = pass.getTotalLength();
      pass.style.strokeDasharray = `${passLen} ${passLen + 20}`;
      dot.setAttribute("cx", String(d.x));
      dot.setAttribute("cy", String(d.y));
    };
    const drawDrop = (p: number) => {
      drop.style.strokeDashoffset = String(dropLen * (1 - p));
      drop.style.visibility = p > 0.002 ? "visible" : "hidden";
      dot.style.opacity = p > 0.98 ? "1" : "0";
    };
    layoutDrop();
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: () => `top+=${Math.max(1, dotPos().y)} 55%`, // dot lands a little above the middle of the screen
      scrub: reduce ? false : true,
      onRefresh: (self) => {
        layoutDrop();
        drawDrop(reduce ? 1 : self.progress);
      },
      onUpdate: (self) => drawDrop(reduce ? 1 : self.progress),
    });
    drawDrop(reduce ? 1 : st.progress);

    // ...then on behind the photos to the bottom edge as you keep scrolling
    const drawPass = (p: number) => {
      pass.style.strokeDashoffset = String(passLen * (1 - p));
      pass.style.visibility = p > 0.002 ? "visible" : "hidden";
    };
    const st2 = ScrollTrigger.create({
      trigger: section,
      start: () => `top+=${Math.max(1, dotPos().y)} 55%`,
      end: "bottom bottom",
      scrub: reduce ? false : true,
      onRefresh: (self) => drawPass(reduce ? 1 : self.progress),
      onUpdate: (self) => drawPass(reduce ? 1 : self.progress),
    });
    drawPass(reduce ? 1 : st2.progress);

    /* 2. the frame around the active photo, following it while it widens / glides to a stop */
    let active: HTMLElement | null = null;
    let p = 0; // how much of dot→frame is drawn
    const framePath = (card: HTMLElement) => {
      const s = section.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const d = dotPos();
      const l = c.left - s.left - PAD;
      const r = c.right - s.left + PAD;
      const t = c.top - s.top - PAD;
      const b = c.bottom - s.top + PAD;
      const mx = Math.min(Math.max(d.x, l + R), r - R); // where the thread meets the frame's top edge
      // dot → down onto the top edge, then once round the frame (clockwise) back to the start
      return (
        `M${d.x},${d.y} C${d.x},${(d.y + t) / 2} ${mx},${(d.y + t) / 2} ${mx},${t}` +
        ` L${r - R},${t} Q${r},${t} ${r},${t + R} L${r},${b - R} Q${r},${b} ${r - R},${b}` +
        ` L${l + R},${b} Q${l},${b} ${l},${b - R} L${l},${t + R} Q${l},${t} ${l + R},${t} L${mx},${t}`
      );
    };

    let raf = 0;
    let visible = false;
    const tick = () => {
      raf = 0;
      const now = section.querySelector<HTMLElement>("[data-gallery-strip] figure:hover, [data-gallery-strip] figure:focus-visible, [data-gallery-strip] figure[data-open=true]");
      if (now !== active && now && p > 0.02) {
        p = Math.max(0, p - 0.12); // moving to another photo: pull back first
      } else {
        if (now !== active) active = now;
        const target = active && dot.style.opacity === "1" ? 1 : 0;
        p = reduce ? target : p + (target - p) * (target ? 0.09 : 0.16);
        if (Math.abs(target - p) < 0.002) p = target;
      }
      if (active && p > 0) {
        frame.setAttribute("d", framePath(active));
        const len = frame.getTotalLength();
        frame.style.strokeDasharray = `${len} ${len + 20}`;
        frame.style.strokeDashoffset = String(len * (1 - p));
        frame.style.visibility = "visible";
      } else {
        frame.style.visibility = "hidden";
        if (!now) active = null;
      }
      if (visible) raf = requestAnimationFrame(tick);
    };
    // only run while the section is on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(section);

    return () => {
      st.kill();
      st2.kill();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
    {/* behind the photo strip */}
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block">
      <path ref={passRef} fill="none" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} strokeLinecap="round" style={{ visibility: "hidden" }} />
    </svg>
    <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible md:block">
      <path ref={dropRef} fill="none" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} strokeLinecap="round" style={{ visibility: "hidden" }} />
      <path
        ref={frameRef}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={THREAD.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ visibility: "hidden" }}
      />
      <circle ref={dotRef} r={5.5} fill="var(--accent)" style={{ opacity: 0, transition: "opacity 0.3s" }} />
    </svg>
    </>
  );
}
