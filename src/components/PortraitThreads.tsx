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
const THREADS = 560; // how many threads make up the figure
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
const Y1 = 0.998;
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
  [-0.62, 0.6], [-0.42, 0.76], [-0.22, 0.83], [-0.08, 0.8], [0.0, 0.69], [0.06, 0.52], [0.12, 0.3], [0.18, 0.19], [0.28, 0.165],
];
const BODY_D: [number, number][] = [
  [-0.62, 0.33], [-0.1, 0.32], [0.06, 0.26], [0.15, 0.19], [0.28, 0.17],
];
const FACE_W: [number, number][] = [
  [0.24, 0.0], [0.27, 0.1], [0.31, 0.17], [0.36, 0.205], [0.42, 0.232], [0.5, 0.258], [0.62, 0.27],
];
const HEAD_C = 0.62;
const HEAD_RY = 0.38;
function headW(y: number) {
  const t = (y - HEAD_C) / HEAD_RY;
  if (Math.abs(t) >= 1) return 0;
  if (y >= HEAD_C) {
    // fuller, rounder skull
    return 0.27 * Math.pow(1 - t * t, 0.5);
  }
  // face: cheeks → jaw → rounded chin (wider than the neck, so the jaw shows)
  return profile(FACE_W, y);
}
function headD(y: number) {
  const t = (y - HEAD_C) / HEAD_RY;
  return Math.abs(t) >= 1 ? 0 : 0.31 * Math.pow(1 - t * t, 0.45);
}
/** smooth maximum, so the head flows into the neck */
const smax = (a: number, b: number, k = 0.04) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (a - b)) / k));
  return b + (a - b) * h + k * h * (1 - h);
};
const width = (y: number) => (y > 0.42 ? headW(y) : y < 0.18 ? profile(BODY_W, y) : smax(headW(y), profile(BODY_W, y), 0.03));
const depth = (y: number) => (y > 0.42 ? headD(y) : y < 0.18 ? profile(BODY_D, y) : smax(headD(y), profile(BODY_D, y), 0.03));
/**
 * Face relief on the front of the head (no detailed features — just enough
 * shape for the light to pick out a brow, eye sockets, nose, cheekbones and
 * chin, like the reference).
 */
const g2 = (x: number, s: number) => Math.exp(-(x * x) / (s * s));
function relief(y: number, a: number) {
  const front = Math.cos(a);
  if (front <= 0 || y < 0.3) return 0;
  const u = Math.sin(a); // -1 (right edge) … 1 (left edge) across the face
  const v = (y - HEAD_C) / HEAD_RY; // -1 chin … 1 crown
  const au = Math.abs(u);
  const r =
    0.06 * g2(u, 0.11) * g2(v + 0.2, 0.22) + // nose
    0.028 * g2(u, 0.55) * g2(v - 0.2, 0.08) + // brow
    -0.04 * g2(au - 0.36, 0.15) * g2(v - 0.04, 0.11) + // eye sockets
    0.022 * g2(au - 0.58, 0.14) * g2(v + 0.12, 0.14) + // cheekbones
    0.018 * g2(u, 0.2) * g2(v + 0.5, 0.06) + // lips
    0.03 * g2(u, 0.26) * g2(v + 0.74, 0.1); // chin
  return r * Math.pow(front, 1.5);
}
/** small ears on the sides of the head */
const ear = (y: number, a: number) => 0.035 * g2((y - HEAD_C + 0.02) / HEAD_RY, 0.13) * Math.pow(Math.abs(Math.sin(a)), 8);
const surf = (y: number, a: number): V3 => ({ x: (width(y) + ear(y, a)) * Math.sin(a), y, z: depth(y) * Math.cos(a) + relief(y, a) });

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
  const len = 0.5 + rand() * 1.0;
  const ds = len / (PTS - 1);
  const curl = (rand() - 0.5) * 5.5; // threads bend and loop, like loose wire
  const wig = rand() * 6.28;
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
    dir += curl * ds + Math.sin(wig + j * 0.7) * 0.12;
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

    // The canvas is bigger than its box: it spills left (over the name is
    // fine), a little right and down to the end of the hero, so the whole
    // figure fits with no hard edges. W×H is the box; L/R/T/B the overhang.
    let W = 0;
    let H = 0;
    let L = 0;
    let R = 0;
    let T = 0;
    let B = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const sec = wrap.closest("section")?.getBoundingClientRect();
      dpr = Math.min(1.25, window.devicePixelRatio || 1); // fine threads look the same; far fewer pixels to fill
      W = r.width;
      H = r.height;
      L = Math.max(0, Math.min(r.left - 4, W * 1.2));
      R = Math.max(0, Math.min(vw - r.right - 4, W * 0.3));
      T = Math.max(0, Math.min(sec ? r.top - sec.top : 0, H * 0.08));
      B = Math.max(0, Math.min(sec ? sec.bottom - r.bottom : 0, H * 0.6));
      const cw = W + L + R;
      const ch = H + T + B;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      Object.assign(canvas.style, { left: `${-L}px`, top: `${-T}px`, width: `${cw}px`, height: `${ch}px` });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("resize", resize);

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

    const light = norm({ x: -0.3, y: 0.8, z: 0.4 }); // soft light from the upper left

    const draw = (now: number) => {
      const dt = Math.min(64, now - lastT);
      lastT = now;
      const stepAmt = dt / FORM_MS;
      prog = goal > prog ? Math.min(goal, prog + stepAmt) : Math.max(goal, prog - stepAmt * 0.8);
      const time = now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W + L + R, H + T + B);
      ctx.globalCompositeOperation = "lighter"; // overlapping threads glow brighter
      ctx.lineCap = "round";

      // scale: the figure is ~1.56 wide × ~1.62 tall (y from -0.62 to 1.0)
      // framed like the reference: the head fills the upper part, the
      // shoulders run off both sides and the chest is cut by the bottom edge
      // the whole bust (shoulders ±0.92, down to y -0.62) fits inside the canvas;
      // the head stays centred on its box unless the shoulders would hit the edge
      const topY = H * 0.045;
      const S = Math.min((W * 0.46) / 0.53, (H + B - topY) / 1.66, (W + L + R) / 1.9);
      const half = 0.95 * S;
      const baseX = L + Math.min(Math.max(W / 2, -L + half), W + R - half);
      const toScreen = (p: V3) => ({ x: baseX + p.x * S, y: T + topY + (1.0 - p.y) * S });

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

      // Pieces are grouped into a few brightness levels and each level is
      // stroked once — ~16 strokes a frame instead of thousands.
      const LEVELS = 16;
      const MAX_A = 0.9;
      const paths = Array.from({ length: LEVELS }, () => new Path2D());
      const xs = new Float32Array(PTS);
      const ys = new Float32Array(PTS);
      const addPiece = (from: number, to: number, a: number) => {
        const lvl = Math.min(LEVELS - 1, Math.round((Math.min(MAX_A, a) / MAX_A) * (LEVELS - 1)));
        if (lvl <= 0) return;
        const path = paths[lvl];
        path.moveTo(xs[from], ys[from]);
        for (let k = from + 1; k <= to; k++) path.lineTo(xs[k], ys[k]);
      };

      for (let i = 0; i < threads.length; i++) {
        const th = threads[i];
        const m = ease(Math.min(1, Math.max(0, (prog * 1.5 - th.delay) / 1)));
        const wob = th.seed;
        const CH = 3; // each thread is drawn in a few pieces so its brightness can vary along it
        const per = Math.ceil((PTS - 1) / CH);
        let alphaSum = 0;
        let count = 0;
        let pieceStart = 0;
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
          xs[j] = s.x;
          ys[j] = s.y;

          // lighting: bright rims and top of the head, dark front of the face
          const nr = th.normal[j];
          const nx = nr.x * cy + nr.z * sy;
          const nz = -nr.x * sy + nr.z * cy;
          const facing = Math.abs(nz);
          const rim = Math.pow(1 - facing, 2.6);
          const lit = Math.max(0, nx * light.x + nr.y * light.y + nz * light.z);
          const top = Math.max(0, nr.y) ** 2;
          const back = p.z < 0 ? 0.35 : 1; // threads on the far side are dimmer
          // fades towards the bottom of the chest, like the reference
          const fade = smooth(Math.min(1, Math.max(0, (b.y - Y0) / 0.8)));
          const headBoost = b.y > 0.45 ? 1.6 : b.y > 0.2 ? 1 : 0.75; // the head is the brightest part, like the reference
          const figureA = (0.05 + 0.06 * rim + 0.27 * lit + 0.32 * top) * back * fade * headBoost;
          alphaSum += figureA * m + 0.16 * (1 - m);
          count++;
          // end of a piece → file it under its brightness, start the next one here
          if ((j > 0 && j % per === 0) || j === PTS - 1) {
            addPiece(pieceStart, j, alphaSum / count);
            pieceStart = j;
            alphaSum = 0;
            count = 0;
          }
        }
      }
      ctx.lineWidth = 0.8;
      for (let l = 1; l < LEVELS; l++) {
        ctx.strokeStyle = `rgba(235,235,235,${((l / (LEVELS - 1)) * MAX_A).toFixed(3)})`;
        ctx.stroke(paths[l]);
      }
      ctx.globalCompositeOperation = "source-over";
    };

    let raf = 0;
    let visible = true;
    // ~30 fps is plenty for slow-moving threads and halves the drawing work
    let lastDraw = 0;
    const loop = (now: number) => {
      if (now - lastDraw >= 31) {
        lastDraw = now;
        draw(now);
      }
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
      mouse.x = e.clientX - r.left + L;
      mouse.y = e.clientY - r.top + T;
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
      window.removeEventListener("resize", resize);
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
      <canvas ref={canvasRef} className="pointer-events-none absolute" />
      <span
        className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 transition-opacity duration-500 ${hinted ? "opacity-0" : "opacity-100"}`}
      >
        {touch ? "Tap to untangle" : "Hover to untangle"}
      </span>
    </div>
  );
}
