"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * PORTRAIT THREADS
 * ----------------
 * A loose tangle of white threads that keeps drifting and looping on its own
 * (and leans towards the mouse when it gets close). Hover it — or tap it on a
 * phone — and every thread glides into place to form a simple head-and-
 * shoulders outline; move away and they loosen back into the tangle.
 * The outline also forms once by itself after the loading screen, so every
 * visitor sees the trick. Drawn on a <canvas> with requestAnimationFrame.
 */
const THREADS = 22; // how many pieces the outline is split into
const PTS = 26; // points per thread
const FORM_MS = 1100; // time to untangle into the outline
const AUTO_HOLD_MS = 2600; // how long the automatic reveal holds

type P = { x: number; y: number };

/** The outline: one continuous silhouette, in a 1 × 1.15 box (x 0–1, y 0–1.15). */
function silhouette(): P[] {
  const pts: P[] = [];
  const line = (a: P, b: P, n: number) => {
    for (let i = 0; i < n; i++) pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
  };
  const bez = (a: P, c1: P, c2: P, b: P, n: number) => {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const u = 1 - t;
      pts.push({
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      });
    }
  };
  // left side, bottom → shoulder → neck
  line({ x: 0.03, y: 1.15 }, { x: 0.06, y: 0.86 }, 20);
  bez({ x: 0.06, y: 0.86 }, { x: 0.08, y: 0.7 }, { x: 0.22, y: 0.66 }, { x: 0.38, y: 0.6 }, 40);
  bez({ x: 0.38, y: 0.6 }, { x: 0.42, y: 0.585 }, { x: 0.425, y: 0.53 }, { x: 0.42, y: 0.47 }, 14);
  // head: an egg shape over the top, from the left of the neck to the right
  const cx = 0.5;
  const cy = 0.27;
  const steps = 90;
  const rx = 0.17;
  const ry = 0.21;
  // angles chosen so the head meets the top of the neck on both sides,
  // going round over the top of the head
  const a0 = Math.acos((cx - 0.42) / rx); // lower left, where the neck starts
  const a1 = -Math.PI - a0; // lower right
  for (let i = 1; i < steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push({ x: cx - rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  // right side, neck → shoulder → bottom
  bez({ x: 0.58, y: 0.47 }, { x: 0.575, y: 0.53 }, { x: 0.58, y: 0.585 }, { x: 0.62, y: 0.6 }, 14);
  bez({ x: 0.62, y: 0.6 }, { x: 0.78, y: 0.66 }, { x: 0.92, y: 0.7 }, { x: 0.94, y: 0.86 }, 40);
  line({ x: 0.94, y: 0.86 }, { x: 0.97, y: 1.15 }, 20);
  pts.push({ x: 0.97, y: 1.15 });
  return pts;
}

/** Split a polyline into `n` equal-length pieces, each resampled to `m` points. */
function split(poly: P[], n: number, m: number): P[][] {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  const L = cum[cum.length - 1];
  const at = (d: number): P => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return { x: poly[i - 1].x + (poly[i].x - poly[i - 1].x) * t, y: poly[i - 1].y + (poly[i].y - poly[i - 1].y) * t };
  };
  return Array.from({ length: n }, (_, k) => Array.from({ length: m }, (_, j) => at(((k + j / (m - 1)) / n) * L)));
}

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 91.7 + k * 47.3) * 43758.5453;
  return x - Math.floor(x);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function PortraitThreads({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hinted, setHinted] = useState(false); // hide the hint after the first interaction
  const touch = useSyncExternalStore(
    () => () => {},
    () => !window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const targets = split(silhouette(), THREADS, PTS);
    // each thread starts forming at a slightly different moment
    const delay = targets.map((_, i) => rnd(i, 9) * 0.45);

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // form progress: 0 = tangle, 1 = outline
    let goal = reduce ? 1 : 0;
    let prog = goal;
    let lastT = performance.now();
    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    let hovering = false;
    const mouse = { x: -1e4, y: -1e4, inside: false };

    const formFor = (ms: number) => {
      goal = 1;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (!hovering) goal = 0;
      }, ms);
    };

    const draw = (now: number) => {
      const dt = Math.min(64, now - lastT);
      lastT = now;
      // move towards the goal at a steady pace (≈ FORM_MS for a full change)
      const stepAmt = dt / FORM_MS;
      prog = goal > prog ? Math.min(goal, prog + stepAmt) : Math.max(goal, prog - stepAmt * 0.8);
      const time = now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // fit the 1 × 1.15 outline into the box, bottom-aligned
      const s = Math.min(W / 1.0, H / 1.15) * 0.98;
      const ox = (W - s) / 2;
      const oy = H - s * 1.15;
      const toPx = (p: P): P => ({ x: ox + p.x * s, y: oy + p.y * s });

      // the tangle: a drifting ball of loops around the middle of the box
      const tcx = W / 2 + Math.sin(time * 0.23) * W * 0.05;
      const tcy = H * 0.47 + Math.cos(time * 0.19) * H * 0.04;
      const trx = W * 0.3;
      const try_ = H * 0.26;

      // gently pulled towards the cursor when it's near
      let pullX = 0;
      let pullY = 0;
      if (mouse.inside || Math.hypot(mouse.x - W / 2, mouse.y - H / 2) < Math.max(W, H)) {
        const dx = mouse.x - tcx;
        const dy = mouse.y - tcy;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / (Math.max(W, H) * 0.9)) * 0.22;
        pullX = dx * k;
        pullY = dy * k;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 0; i < targets.length; i++) {
        const local = Math.min(1, Math.max(0, (prog * 1.45 - delay[i]) / 1));
        const m = ease(local);
        const ph = rnd(i, 1) * 6.28;
        const sp = 0.25 + rnd(i, 2) * 0.35; // drifting speed
        const loops = 1.2 + rnd(i, 3) * 1.6; // how loopy this thread is in the tangle
        const pts: P[] = [];
        for (let j = 0; j < PTS; j++) {
          const u = j / (PTS - 1);
          // tangled position: a looping Lissajous strand that keeps wandering
          const a = time * sp + ph + u * loops * Math.PI * 2;
          const tx = tcx + pullX + trx * (0.62 * Math.sin(a * 1.0 + ph) + 0.38 * Math.sin(a * 2.3 + time * 0.31));
          const ty = tcy + pullY + try_ * (0.6 * Math.cos(a * 1.15 + ph * 0.7) + 0.4 * Math.cos(a * 1.9 - time * 0.27));
          // formed position, with a faint sway so it still breathes
          const tp = toPx(targets[i][j]);
          // (based on the point's place in the outline, so neighbouring threads move together — no kinks)
          const sway = 1.1 * Math.sin(time * 1.3 + tp.y * 0.035);
          pts.push({ x: tx + (tp.x - tx) * m + sway * m, y: ty + (tp.y - ty) * m });
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.45 + 0.45 * m})`;
        ctx.lineWidth = 1.3 + 0.5 * m;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let j = 1; j < pts.length - 1; j++) {
          const mx = (pts[j].x + pts[j + 1].x) / 2;
          const my = (pts[j].y + pts[j + 1].y) / 2;
          ctx.quadraticCurveTo(pts[j].x, pts[j].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
    };

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      draw(now);
      raf = visible && !reduce ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);

    // pause when off screen; on phones, form once each time it scrolls into view
    let wasVisible = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting && !document.hidden;
        if (visible && !raf && !reduce) {
          lastT = performance.now();
          raf = requestAnimationFrame(loop);
        }
        if (isTouch && e.isIntersecting && !wasVisible && document.documentElement.dataset.loaderGone) formFor(AUTO_HOLD_MS);
        wasVisible = e.isIntersecting;
      },
      { threshold: 0.4 },
    );
    io.observe(wrap);

    // the automatic reveal once the loading screen has gone
    const onLoaded = () => formFor(AUTO_HOLD_MS);
    if (document.documentElement.dataset.loaderGone) onLoaded();
    else window.addEventListener("loader:gone", onLoaded, { once: true });

    // mouse: lean towards the cursor, form while hovering
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      mouse.inside = true;
      clearTimeout(autoTimer);
      goal = 1;
      setHinted(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      mouse.inside = false;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => (goal = 0), 350);
    };
    // touch: tap toggles
    const onTap = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(autoTimer);
      goal = prog > 0.5 ? 0 : 1;
      setHinted(true);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("pointerup", onTap);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("loader:gone", onLoaded);
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerup", onTap);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative touch-manipulation ${className}`} role="img" aria-label="Tangled threads that untangle into the outline of a person">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <span
        className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 transition-opacity duration-500 ${hinted ? "opacity-0" : "opacity-100"}`}
      >
        {touch ? "Tap to untangle" : "Hover to untangle"}
      </span>
    </div>
  );
}
