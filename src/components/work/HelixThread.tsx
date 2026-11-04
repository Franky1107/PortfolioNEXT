"use client";

/**
 * HELIX THREAD
 * ------------
 * A precise parametric helix (uniform radius, pitch and spacing) coiling down
 * the gap between the two columns of the work section, drawn as you scroll.
 *
 * It's a 3D helix around a vertical axis, seen from slightly above:
 *   x = cx + R·sin θ
 *   y = y0 + P·θ/2π + E·cos θ
 * The whole coil is drawn above the panels; the back half of every turn
 * (cos θ < 0) is slightly fainter and sits under the front half, which gives
 * it depth while every loop stays fully visible.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HELIX, THREAD } from "@/lib/thread/config";
import { moveTo, smoothCommands } from "@/lib/thread/geometry";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Arc = { d: string; front: boolean };
type Geo = { w: number; h: number; arcs: Arc[]; start: { x: number; y: number }; end: { x: number; y: number }; cx: number; y0: number; R: number; P: number; E: number; thetaMax: number };

export default function HelixThread({ root }: { root: string }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const arcRefs = useRef<(SVGPathElement | null)[]>([]);
  const tipRef = useRef<SVGGElement>(null);
  const startRef = useRef<SVGGElement>(null);
  const endRef = useRef<SVGGElement>(null);
  const lastKey = useRef("");

  /* 1. MEASURE + BUILD ------------------------------------------------ */
  const build = useCallback(() => {
    const sec = document.querySelector<HTMLElement>(root);
    const left = sec?.querySelector<HTMLElement>("[data-helix-left]");
    const right = sec?.querySelector<HTMLElement>("[data-helix-right]");
    if (!sec || !left || !right || window.innerWidth < THREAD.mobileBreakpoint) {
      if (lastKey.current !== "off") {
        lastKey.current = "off";
        setGeo(null);
      }
      return;
    }
    const s = sec.getBoundingClientRect();
    const l = left.getBoundingClientRect();
    const r = right.getBoundingClientRect();

    const cx = (l.right + r.left) / 2 - s.left; // centre of the gap
    const R = Math.min(HELIX.radiusMax, Math.max(HELIX.radiusMin, window.innerWidth * HELIX.radiusVw));
    const P = R * HELIX.pitch; // vertical distance per full turn
    const E = R * HELIX.tilt; // how far front/back halves separate vertically
    const y0 = r.top - s.top + HELIX.inset;
    const y1 = r.bottom - s.top - HELIX.inset;
    const thetaMax = ((y1 - y0 - 2 * E) / P) * Math.PI * 2;

    // split the helix into half-turns: front (cos θ > 0) and back (cos θ < 0)
    const pt = (th: number) => ({ x: cx + R * Math.sin(th), y: y0 + E + (P * (th + Math.PI / 2)) / (Math.PI * 2) + E * Math.cos(th) });
    const arcs: Arc[] = [];
    const per = HELIX.samplesPerHalfTurn;
    for (let a = -Math.PI / 2, k = 0; a < thetaMax - Math.PI / 2 - 1e-6; a += Math.PI, k++) {
      const b = Math.min(a + Math.PI, thetaMax - Math.PI / 2);
      const pts = Array.from({ length: per + 1 }, (_, i) => pt(a + ((b - a) * i) / per));
      arcs.push({ d: moveTo(pts[0]) + smoothCommands(pts).join(""), front: k % 2 === 0 });
    }

    const key = `${s.width}|${s.height}|${cx}|${R}|${arcs.length}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    setGeo({ w: s.width, h: s.height, arcs, start: pt(-Math.PI / 2), end: pt(thetaMax - Math.PI / 2), cx, y0, R, P, E, thetaMax });
  }, [root]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(build, 120);
    };
    build();
    const sec = document.querySelector(root);
    const ro = new ResizeObserver(schedule);
    if (sec) ro.observe(sec);
    window.addEventListener("resize", schedule);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [build, root]);

  /* 2. DRAW ON SCROLL ------------------------------------------------- */
  useLayoutEffect(() => {
    if (!geo) return;
    const els = arcRefs.current.slice(0, geo.arcs.length);
    const lens = els.map((el) => el?.getTotalLength() ?? 0);
    const total = lens.reduce((a, b) => a + b, 0);
    els.forEach((el, i) => el && (el.style.strokeDasharray = `${lens[i]} ${lens[i] + 20}`));

    const render = (p: number) => {
      let left = p * total;
      let tipArc = -1;
      let tipFrac = 0;
      els.forEach((el, i) => {
        if (!el) return;
        const d = Math.max(0, Math.min(lens[i], left));
        el.style.strokeDashoffset = String(lens[i] - d);
        el.style.visibility = d > 0.3 ? "visible" : "hidden";
        if (d > 0 && d < lens[i]) {
          tipArc = i;
          tipFrac = d / lens[i];
        }
        left -= lens[i];
      });
      // glowing tip at the drawing end (θ from the arc it's on)
      const tip = tipRef.current;
      if (tip) {
        if (tipArc >= 0) {
          const th = -Math.PI / 2 + (tipArc + tipFrac) * Math.PI;
          const x = geo.cx + geo.R * Math.sin(th);
          const y = geo.y0 + geo.E + (geo.P * (th + Math.PI / 2)) / (Math.PI * 2) + geo.E * Math.cos(th);
          tip.setAttribute("transform", `translate(${x} ${y})`);
          tip.style.opacity = "1";
        } else tip.style.opacity = "0";
      }
      startRef.current?.classList.toggle("is-on", p > 0.001);
      endRef.current?.classList.toggle("is-on", p > 0.999);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: document.querySelector(root),
      start: `top ${HELIX.startAt}`,
      end: `bottom ${HELIX.endAt}`,
      scrub: true,
      onUpdate: (self) => render(self.progress),
    });
    render(st.progress);
    return () => st.kill();
  }, [geo, root]);

  if (!geo) return null;

  const stroke = THREAD.strokeWidth;
  const style = {
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    visibility: "hidden" as const,
  };
  const svg = (z: number) => (
    <svg
      width={geo.w}
      height={geo.h}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 hidden md:block"
      style={{ zIndex: z }}
    >
      {/* back halves first (underneath), then front halves on top */}
      {[false, true].map((front) =>
        geo.arcs.map((a, i) =>
          a.front === front ? (
            <path
              key={`${front}-${i}`}
              ref={(el) => {
                arcRefs.current[i] = el;
              }}
              d={a.d}
              style={{ ...style, opacity: front ? 1 : HELIX.backOpacity }}
            />
          ) : null,
        ),
      )}
      {(
        <>
          {[
            { ref: startRef, at: geo.start },
            { ref: endRef, at: geo.end },
          ].map(({ ref, at }, i) => (
            <g key={i} ref={ref} transform={`translate(${at.x} ${at.y})`}>
              <g className="thread-ring">
                <circle r={Math.max(10, stroke * 4.6)} fill="var(--beige)" stroke="var(--accent)" strokeWidth={stroke} />
                <circle r={Math.max(3.5, stroke * 1.5)} fill="var(--accent)" />
              </g>
            </g>
          ))}
          <g ref={tipRef} style={{ opacity: 0 }}>
            <circle r={3.6} fill="var(--accent)" />
          </g>
        </>
      )}
    </svg>
  );

  return svg(30);
}
