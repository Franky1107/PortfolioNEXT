"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { THREAD } from "@/lib/thread/config";
import { moveTo, smoothCommands } from "@/lib/thread/geometry";
import type { Pt } from "@/lib/thread/types";

/**
 * LET'S CONNECT — the last section.
 * Left: big headline, "Let's talk" link, back to top.
 * Right: a tangled thread hanging from the top with a ring at its end.
 * Drag the ring ("pull to untangle") and the tangle straightens out towards
 * it; let go and it springs back into its knot.
 */
const CONTACT = {
  lines: ["Got something", "complex?", "Let’s", "connect."],
  talk: { label: "Let’s talk", href: "https://github.com/Franky1107" }, // TODO: your email (mailto:) or LinkedIn
};

// thread drawing space (SVG viewBox)
const VW = 600;
const VH = 720;
const ANCHOR: Pt = { x: 330, y: 0 }; // hangs from the top edge
const REST: Pt = { x: 360, y: 640 }; // where the ring sits when left alone

/** the knot: a few overlapping loops between the anchor and the ring */
const TANGLE: Pt[] = (() => {
  const pts: Pt[] = [ANCHOR, { x: 330, y: 60 }];
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2 * 2.6;
    pts.push({
      x: 320 + 210 * (0.62 * Math.cos(a + 0.6) + 0.38 * Math.cos(2.3 * a)),
      y: 300 + 190 * (0.6 * Math.sin(1.3 * a) + 0.4 * Math.sin(3.1 * a + 0.4)),
    });
  }
  pts.push({ x: 380, y: 560 }, REST);
  return pts;
})();

export default function ContactSection() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const ring = ringRef.current;
    if (!svg || !path || !ring) return;

    const pos = { x: REST.x, y: REST.y }; // the ring
    const n = TANGLE.length - 1;
    const render = () => {
      // how far the ring is pulled from rest → how untangled the thread is
      const t = Math.min(1, Math.hypot(pos.x - REST.x, pos.y - REST.y) / 260);
      const e = t * t * (3 - 2 * t);
      const pts = TANGLE.map((p, i) => {
        const f = i / n;
        const sx = ANCHOR.x + (pos.x - ANCHOR.x) * f; // the straight line anchor → ring
        const sy = ANCHOR.y + (pos.y - ANCHOR.y) * f;
        const tx = p.x + (pos.x - REST.x) * f; // the knot, carried along by the pull
        const ty = p.y + (pos.y - REST.y) * f;
        return { x: tx + (sx - tx) * e, y: ty + (sy - ty) * e };
      });
      path.setAttribute("d", moveTo(pts[0]) + smoothCommands(pts).join(""));
      ring.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
    };
    render();

    // pointer → viewBox coordinates
    const toSvg = (e: PointerEvent) => {
      const m = svg.getScreenCTM();
      if (!m) return pos;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: Math.min(VW - 20, Math.max(20, p.x)), y: Math.min(VH + 120, Math.max(80, p.y)) };
    };
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      ring.setPointerCapture(e.pointerId);
      gsap.killTweensOf(pos);
      hintRef.current?.classList.add("opacity-0");
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      Object.assign(pos, toSvg(e));
      render();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      gsap.to(pos, { x: REST.x, y: REST.y, duration: 1.4, ease: "elastic.out(1, 0.45)", onUpdate: render });
      hintRef.current?.classList.remove("opacity-0");
    };
    ring.addEventListener("pointerdown", down);
    ring.addEventListener("pointermove", move);
    ring.addEventListener("pointerup", up);
    ring.addEventListener("pointercancel", up);
    return () => {
      gsap.killTweensOf(pos);
      ring.removeEventListener("pointerdown", down);
      ring.removeEventListener("pointermove", move);
      ring.removeEventListener("pointerup", up);
      ring.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <footer id="contact" className="relative grid min-h-[100svh] grid-cols-1 overflow-hidden border-t border-white/10 px-5 pb-10 pt-24 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:px-[3vw] md:pb-[3vw] md:pt-[calc(72px+3vw)]">
      {/* LEFT — headline, let's talk, back to top */}
      <div className="flex flex-col">
        <h2 className="type-heavy text-[14vw] uppercase leading-[0.9] md:text-[length:min(7.4vw,14svh)]">
          {CONTACT.lines.map((l, i) => (
            // a slightly ragged left edge, like a knot loosening
            <span key={l} className="block" style={{ paddingLeft: `${[0, 0.6, 0.15, 0.4][i % 4]}em` }}>
              {l}
            </span>
          ))}
        </h2>

        <a
          href={CONTACT.talk.href}
          target="_blank"
          rel="noreferrer"
          data-sound
          className="type-heavy group mt-12 inline-flex items-center gap-3 self-start border-b-2 border-white pb-2 text-[clamp(1.6rem,2.6vw,2.6rem)] uppercase leading-none transition-colors hover:border-accent hover:text-accent md:mt-[6svh]"
        >
          {CONTACT.talk.label}.
          <svg viewBox="0 0 24 24" className="h-[0.9em] w-[0.9em] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M6 18 18 6M8 6h10v10" />
          </svg>
        </a>

        <div className="mt-auto flex items-center justify-between gap-6 pt-16 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80 md:text-[12px]">
          <a href="#top" className="inline-flex items-center gap-3 hover:text-accent">
            Back to top <span aria-hidden>↑</span>
          </a>
          <p className="text-white/40">© Sourav Mallick</p>
        </div>
      </div>

      {/* RIGHT — the knot (decorative; drag the ring) */}
      <div aria-hidden className="relative order-first -mx-5 -mt-24 h-[62svh] md:order-none md:mx-0 md:-mt-[calc(72px+3vw)] md:h-auto">
        <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMin meet" className="absolute inset-0 h-full w-full overflow-visible">
          <path ref={pathRef} fill="none" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth * 0.9} strokeLinecap="round" strokeLinejoin="round" />
          <g ref={ringRef} className="cursor-grab touch-none active:cursor-grabbing">
            <circle r={34} fill="transparent" />
            <circle r={13} fill="var(--ink)" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth * 0.9} />
          </g>
        </svg>
        <p ref={hintRef} className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80 transition-opacity md:text-[12px]">
          Pull to untangle
        </p>
      </div>
    </footer>
  );
}
