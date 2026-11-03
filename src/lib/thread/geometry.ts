import type { Pt } from "./types";

export const TAU = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const f = (n: number) => Math.round(n * 10) / 10; // 1 decimal keeps paths small

/** Tiny seeded random generator, so the hand-drawn shapes look the same on every load. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Turns a list of points into smooth cubic-Bézier commands (Catmull-Rom).
 * Returns one "C" command per point-to-point step, so the length up to any
 * point index can be measured exactly (commands.slice(0, i)).
 */
export function smoothCommands(pts: Pt[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    out.push(`C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2.x)},${f(p2.y)}`);
  }
  return out;
}

export const moveTo = (p: Pt) => `M${f(p.x)},${f(p.y)}`;

/** Removes points that sit on top of each other (they make kinks). */
export function dedupe(pts: Pt[], min = 1.5): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p.x - q.x, p.y - q.y) >= min) out.push(p);
  }
  return out;
}

/** A nearly-straight line from a to b with a slight hand-drawn wobble. */
export function wobblyLine(a: Pt, b: Pt, steps: number, amp: number, rand: () => number): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // unit normal
  const ny = dx / len;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const edge = i === 0 || i === steps ? 0 : 1; // endpoints stay exact
    const o = (rand() - 0.5) * 2 * amp * edge + Math.sin(t * Math.PI) * amp * 0.6 * edge;
    pts.push({ x: lerp(a.x, b.x, t) + nx * o, y: lerp(a.y, b.y, t) + ny * o });
  }
  return pts;
}

/**
 * The raw-data scribble: a slow wandering path with fast small loops on top
 * (like a pen scribbling), eased in from `entry` and out to `exit`.
 */
export function scribble(
  c: Pt,
  rx: number,
  ry: number,
  opts: { loops: number; points: number },
  rand: () => number,
  entry: Pt,
  exit: Pt,
): Pt[] {
  const ph = Array.from({ length: 6 }, () => rand() * TAU);
  const loopR = ry * 0.42;
  const n = opts.points;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * TAU * 2.6;
    // slow wander across the whole tangle
    const wx = 0.62 * Math.sin(a + ph[0]) + 0.38 * Math.sin(a * 2.27 + ph[1]);
    const wy = 0.6 * Math.cos(a * 0.91 + ph[2]) + 0.4 * Math.cos(a * 1.83 + ph[3]);
    // fast loops of varying size
    const b = t * TAU * opts.loops + ph[4];
    const size = 0.75 + 0.35 * Math.sin(a * 3.1 + ph[5]);
    let x = c.x + wx * (rx - loopR * 1.25) + Math.cos(b) * loopR * size * 1.25;
    let y = c.y + wy * (ry - loopR) + Math.sin(b) * loopR * size;
    // a little pen jitter
    x += (rand() - 0.5) * 2;
    y += (rand() - 0.5) * 2;
    // ease in from the entry point and out to the exit point
    const ein = smooth(clamp(t / 0.07));
    const eout = smooth(clamp((1 - t) / 0.07));
    x = lerp(exit.x, lerp(entry.x, x, ein), eout);
    y = lerp(exit.y, lerp(entry.y, y, ein), eout);
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Rings: the thread spirals down inside the funnel, front arc first,
 * from yFrom to yTo. `halfAt(y)` gives the funnel half-width at height y.
 */
export function spiral(
  cx: number,
  yFrom: number,
  yTo: number,
  halfAt: (y: number) => number,
  turns: number,
  squash = 0.17,
  perTurn = 28,
): Pt[] {
  const n = Math.round(turns * perTurn);
  const pts: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const th = Math.PI - TAU * turns * t; // start on the left, sweep the front (lower) arc first
    // stay level for most of each loop, then step down on the left → flat rings
    const u = turns * t;
    const k = Math.floor(u);
    const fr = u - k;
    const level = (k + smooth(clamp((fr - 0.8) / 0.2))) / turns;
    const y0 = lerp(yFrom, yTo, level);
    const hw = halfAt(y0) * 0.94;
    pts.push({ x: cx + hw * Math.cos(th), y: y0 + hw * squash * Math.sin(th) });
  }
  return pts;
}

/**
 * A coil (helix) wound round a stroke of a letter, like thread wrapped round a pin.
 *   axis "y": round a vertical stroke centred at `at`, running from `from` to `to` (y values)
 *   axis "x": round a horizontal stroke centred at `at`, running from `from` to `to` (x values)
 * `r` is how far the loops reach either side of the stroke, `tilt` separates the
 * front and back crossings so the back ones can be hidden behind the letter.
 * Returns the points plus small rectangles where the thread passes BEHIND the stroke.
 */
export function coil(opts: {
  axis: "x" | "y";
  at: number;
  from: number;
  to: number;
  r: number;
  turns: number;
  strokeHalf: number;
  tilt?: number;
  perTurn?: number;
}) {
  const { axis, at, from, to, r, turns, strokeHalf } = opts;
  const tilt = opts.tilt ?? 5;
  const perTurn = opts.perTurn ?? 14;
  const n = Math.round(turns * perTurn);
  const pitch = (to - from) / turns;
  const pts: Pt[] = [];
  const under: { left: number; top: number; width: number; height: number }[] = [];
  const pad = 2.5;
  for (let i = 0; i <= n; i++) {
    const th = (i / perTurn) * TAU; // 0 = right side (or below, for axis x)
    const along = from + pitch * (th / TAU) - tilt * Math.sin(th);
    const across = at + r * Math.cos(th);
    pts.push(axis === "y" ? { x: across, y: along } : { x: along, y: across });
  }
  // back crossings happen at th = 3π/2 + k·2π
  for (let k = 0; k < Math.ceil(turns); k++) {
    const th = 1.5 * Math.PI + k * TAU;
    if (th / TAU > turns) break;
    const along = from + pitch * (th / TAU) + tilt;
    const half = Math.max(5, Math.abs(pitch) * 0.22);
    if (axis === "y") under.push({ left: at - strokeHalf - pad, top: along - half, width: (strokeHalf + pad) * 2, height: half * 2 });
    else under.push({ left: along - half, top: at - strokeHalf - pad, width: half * 2, height: (strokeHalf + pad) * 2 });
  }
  return { pts, under };
}

/** A small spring (tiny loops) running straight down from `a` for `length` px. */
export function spring(a: Pt, length: number, loops: number, r: number, perLoop = 10): Pt[] {
  const pts: Pt[] = [];
  const n = loops * perLoop;
  for (let i = 1; i <= n; i++) {
    const th = (i / perLoop) * TAU;
    const t = i / n;
    pts.push({ x: a.x + r * Math.sin(th), y: a.y + t * length - r * 0.6 * (1 - Math.cos(th)) * (1 - t) });
  }
  pts.push({ x: a.x, y: a.y + length + 2 });
  return pts;
}
