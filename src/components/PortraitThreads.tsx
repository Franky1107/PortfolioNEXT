"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * PORTRAIT THREADS
 * ----------------
 * Hundreds of fine threads. While waiting they form a loose ball that keeps
 * drifting and looping (and leans towards the mouse when it's near). Hover
 * it — or tap on a phone — and every thread glides onto the surface of a 3D
 * head-and-shoulders figure, wrapping around it like wire, lit brighter at
 * the edges and the top of the head. The figure turns slowly. Move away and
 * the threads loosen back into the ball.
 * The figure also forms once by itself after the loading screen.
 * Drawn on a <canvas> with requestAnimationFrame.
 */
const PTS = 26; // points per thread
const THREADS = 520; // how many threads make up the figure
const FORM_MS = 1300; // time to untangle into the figure
const AUTO_HOLD_MS = 2800; // how long the automatic reveal holds

type V3 = { x: number; y: number; z: number };
type Thread = { body: V3[]; normal: V3[]; ball: V3[]; delay: number; seed: number };

// seeded random
let seedState = 7;
const rand = () => {
  seedState = (seedState * 1664525 + 1013904223) >>> 0;
  return seedState / 4294967296;
};
const norm = (v: V3): V3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const randUnit = (): V3 => {
  const u = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(t), y: u, z: s * Math.sin(t) };
};

/**
 * The figure: one continuous surface (like a lathe-turned bust). At every
 * height y it has an elliptical cross-section of half-width w(y) and
 * half-depth d(y): skull → jaw → neck → sloping shoulders → chest.
 * Units: y from -0.62 (bottom) to 1.0 (top of the head); z points at you.
 */
const Y0 = -0.62;
const Y1 = 0.99;
const smooth = (t: number) => t * t * (3 - 2 * t);
/** piecewise-smooth interpolation through (y, value) pairs */
function profile(pts: [number, number][], y: number) {
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][0]) {
      const [ya, va] = pts[i - 1];
      const [yb, vb] = pts[i];
      return va + (vb - va) * smooth((y - ya) / (yb - ya));
    }
  }
  return pts[pts.length - 1][1];
}
const BODY_W: [number, number][] = [
  [-0.62, 0.8], [-0.3, 0.8], [-0.12, 0.77], [0.0, 0.69], [0.08, 0.46], [0.15, 0.22], [0.21, 0.14], [0.33, 0.128],
];
const BODY_D: [number, number][] = [
  [-0.62, 0.32], [-0.1, 0.31], [0.06, 0.24], [0.16, 0.15], [0.33, 0.135],
];
const HEAD_C = 0.64;
const HEAD_RY = 0.355;
function headW(y: number) {
  const t = (y - HEAD_C) / HEAD_RY;
  if (Math.abs(t) >= 1) return 0;
  const jaw = y < HEAD_C ? 1 - 0.3 * smooth(Math.min(1, (HEAD_C - y) / 0.33)) : 1; // narrower towards the chin
  return 0.265 * Math.sqrt(1 - t * t) * jaw;
}
function headD(y: number) {
  const t = (y - HEAD_C) / HEAD_RY;
  return Math.abs(t) >= 1 ? 0 : 0.3 * Math.sqrt(1 - t * t);
}
/** smooth maximum, so the head flows into the neck */
const smax = (a: number, b: number, k = 0.04) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (a - b)) / k));
  return b + (a - b) * h + k * h * (1 - h);
};
const width = (y: number) => (y > 0.45 ? headW(y) : y < 0.25 ? profile(BODY_W, y) : smax(headW(y), profile(BODY_W, y)));
const depth = (y: number) => (y > 0.45 ? headD(y) : y < 0.25 ? profile(BODY_D, y) : smax(headD(y), profile(BODY_D, y)));
const surf = (y: number, a: number): V3 => ({ x: width(y) * Math.sin(a), y, z: depth(y) * Math.cos(a) });

/** A thread laid across the body's surface in a random direction. */
function bodyThread(): { pts: V3[]; nrm: V3[] } {
  // pick a start point, weighted towards wider parts so the density is even
  let y = 0;
  for (let k = 0; k < 20; k++) {
    y = Y0 + rand() * (Y1 - Y0);
    if (rand() < width(y) / 0.8 + 0.25) break;
  }
  let a = rand() * Math.PI * 2;
  const phi = rand() * Math.PI * 2; // direction across the surface
  const len = 0.35 + rand() * 0.9;
  const ds = len / (PTS - 1);
  const curl = (rand() - 0.5) * 2.2; // gentle bend so threads aren't straight
  const pts: V3[] = [];
  const nrm: V3[] = [];
  let dir = phi;
  for (let j = 0; j < PTS; j++) {
    y = Math.min(Y1, Math.max(Y0, y));
    pts.push(surf(y, a));
    // surface normal from the two tangent directions
    const e = 0.004;
    const pa = surf(y, a + e);
    const pa2 = surf(y, a - e);
    const py = surf(Math.min(Y1, y + e), a);
    const py2 = surf(Math.max(Y0, y - e), a);
    const ta = { x: pa.x - pa2.x, y: pa.y - pa2.y, z: pa.z - pa2.z };
    const ty = { x: py.x - py2.x, y: py.y - py2.y, z: py.z - py2.z };
    let n = norm(cross(ta, ty));
    const out = { x: Math.sin(a), y: 0, z: Math.cos(a) };
    if (n.x * out.x + n.z * out.z < 0) n = { x: -n.x, y: -n.y, z: -n.z };
    if (y > Y1 - 0.02) n = { x: 0, y: 1, z: 0 };
    nrm.push(n);
    // step: vertical part moves y, horizontal part moves round the body
    dir += curl * ds;
    y += Math.cos(dir) * ds;
    a += (Math.sin(dir) * ds) / Math.max(0.12, (width(y) + depth(y)) / 2);
    // over the top of the head: continue down the other side (no flat cap)
    if (y > Y1) {
      y = 2 * Y1 - y;
      a += Math.PI;
      dir = Math.PI - dir;
    }
    // at the bottom edge: turn back up
    if (y < Y0) {
      y = 2 * Y0 - y;
      dir = Math.PI - dir;
    }
  }
  return { pts, nrm };
}

/** Where the same thread sits in the loose ball (a random loop inside a sphere). */
function ballArc(): V3[] {
  const n = randUnit();
  const u = norm(cross(n, Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }));
  const v = cross(n, u);
  const R = 0.28 + rand() * 0.34;
  const off = { x: (rand() - 0.5) * 0.25, y: (rand() - 0.5) * 0.25, z: (rand() - 0.5) * 0.25 };
  const span = Math.PI * (0.8 + rand() * 1.2);
  const start = rand() * Math.PI * 2;
  return Array.from({ length: PTS }, (_, j) => {
    const t = start + (span * j) / (PTS - 1);
    return {
      x: off.x + R * (Math.cos(t) * u.x + Math.sin(t) * v.x),
      y: 0.2 + off.y + R * (Math.cos(t) * u.y + Math.sin(t) * v.y),
      z: off.z + R * (Math.cos(t) * u.z + Math.sin(t) * v.z),
    };
  });
}

function buildThreads(): Thread[] {
  seedState = 7;
  return Array.from({ length: THREADS }, () => {
    const t = bodyThread();
    return { body: t.pts, normal: t.nrm, ball: ballArc(), delay: rand() * 0.5, seed: rand() * 1000 };
  });
}

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
    const threads = buildThreads();

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

    // form progress: 0 = ball, 1 = figure
    let goal = reduce ? 1 : 0;
    let prog = goal;
    let lastT = performance.now();
    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    let hovering = false;
    const mouse = { x: -1e4, y: -1e4 };

    const formFor = (ms: number) => {
      goal = 1;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (!hovering) goal = 0;
      }, ms);
    };

    const view = { x: 0, y: 0, z: 1 };
    const light = norm({ x: -0.3, y: 0.8, z: 0.4 }); // soft light from the upper left

    const draw = (now: number) => {
      const dt = Math.min(64, now - lastT);
      lastT = now;
      const stepAmt = dt / FORM_MS;
      prog = goal > prog ? Math.min(goal, prog + stepAmt) : Math.max(goal, prog - stepAmt * 0.8);
      const time = now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; // overlapping threads glow brighter
      ctx.lineCap = "round";

      // scale: the figure is ~1.56 wide × ~1.62 tall (y from -0.62 to 1.0)
      const S = Math.min(W / 1.62, H / 1.68);
      const baseX = W / 2;
      const baseY = H - S * 0.02; // bottom of the figure at the bottom of the box
      const yTop = 1.0;
      const toScreen = (p: V3) => ({ x: baseX + p.x * S, y: baseY - (p.y - Y0) * S * (1.62 / (yTop - Y0)) });

      // slow turn of the figure; the ball tumbles a bit faster
      const yaw = Math.sin(time * 0.25) * 0.32;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const by = time * 0.18;
      const cb = Math.cos(by);
      const sb = Math.sin(by);

      // ball leans towards the cursor when it's near
      const ballC = toScreen({ x: 0, y: 0.2, z: 0 });
      const dx = mouse.x - ballC.x;
      const dy = mouse.y - ballC.y;
      const dist = Math.hypot(dx, dy) || 1;
      const lean = Math.max(0, 1 - dist / (Math.max(W, H) * 0.9)) * 0.2;
      const pullX = (dx * lean) / S;
      const pullY = (-dy * lean) / S;

      for (let i = 0; i < threads.length; i++) {
        const th = threads[i];
        const m = ease(Math.min(1, Math.max(0, (prog * 1.5 - th.delay) / 1)));
        const wob = th.seed;
        let prev: { x: number; y: number } | null = null;
        let alphaSum = 0;
        ctx.beginPath();
        for (let j = 0; j < PTS; j++) {
          // figure position (rotated by yaw)
          const b = th.body[j];
          const bx = b.x * cy + b.z * sy;
          const bz = -b.x * sy + b.z * cy;
          // ball position (tumbling + drifting loops)
          const q = th.ball[j];
          const wx = Math.sin(time * 0.6 + wob + j * 0.2) * 0.04;
          const qx = q.x * cb + q.z * sb + wx + pullX;
          const qz = -q.x * sb + q.z * cb;
          const qy = q.y + Math.cos(time * 0.5 + wob * 1.3 + j * 0.25) * 0.04 + pullY;
          const p = { x: qx + (bx - qx) * m, y: qy + (b.y - qy) * m, z: qz + (bz - qz) * m };
          const s = toScreen(p);
          if (!prev) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
          prev = s;

          // lighting: bright at the edges (rim) and where lit, faint on the front of the face
          const nr = th.normal[j];
          const nx = nr.x * cy + nr.z * sy;
          const nz = -nr.x * sy + nr.z * cy;
          const facing = Math.abs(nx * view.x + nr.y * view.y + nz * view.z);
          const rim = Math.pow(1 - facing, 1.6);
          const lit = Math.max(0, nx * light.x + nr.y * light.y + nz * light.z);
          const back = p.z < 0 ? 0.45 : 1; // threads on the far side are dimmer
          const figureA = (0.06 + 0.5 * rim + 0.22 * lit) * back;
          alphaSum += figureA * m + 0.18 * (1 - m);
        }
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.85, alphaSum / PTS)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
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

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      clearTimeout(autoTimer);
      goal = 1;
      setHinted(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => (goal = 0), 350);
    };
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
    <div ref={wrapRef} className={`relative touch-manipulation ${className}`} role="img" aria-label="Tangled threads that wrap into the figure of a person">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <span
        className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 transition-opacity duration-500 ${hinted ? "opacity-0" : "opacity-100"}`}
      >
        {touch ? "Tap to untangle" : "Hover to untangle"}
      </span>
    </div>
  );
}
