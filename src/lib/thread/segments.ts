/**
 * THE THREAD'S ROUTE
 * ------------------
 * Each "segment" reads the real positions of elements marked with
 * data-thread="…" and returns the points the thread passes through.
 * Segments are joined in order into ONE continuous, smoothed thread.
 *
 * To extend the thread into a new section later (About, Projects, Contact):
 *   1. mark elements in that section with data-thread="something"
 *   2. write a new Segment below that uses ctx.box("something")
 *   3. add it to SEGMENTS at the bottom of this file (in page order).
 *      Put it before funnelSegment if it should come before the funnel,
 *      or move the node/branches (they always sit at the end of the thread).
 */
import { FUNNEL } from "./config";
import { coil, lerp, scribble, seeded, spiral, spring, wobblyLine } from "./geometry";
import type { Box, Connector, Pt, Segment } from "./types";

/* ------------------------------------------------------------------ */
/* 1. HERO — drawn automatically on page load. Follows the hand sketch: */
/*    ◎ start → into the "S" → behind the "o"'s left side → along the   */
/*    bottom of "ur" → over the top and coiled round the "a" → a        */
/*    hairpin line through the gap between the words → loop round the   */
/*    "k" (behind its stem) → coil round the "c" → spring → ◎ end       */
/* ------------------------------------------------------------------ */

/** Turn a plain rectangle into a Box */
const rect = (left: number, top: number, width: number, height: number): Box => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  cx: left + width / 2,
  cy: top + height / 2,
});

export const heroSegment: Segment = (ctx) => {
  const iam = ctx.box("iam");
  const tag = ctx.box("tagline");
  const hero = ctx.box("hero");
  const photo = ctx.box("photo");
  const line1 = ctx.boxes("name-1"); // S o u r a v
  const line2 = ctx.boxes("name-2"); // M a l l i c k
  if (!iam || !tag || !hero || line1.length < 6 || line2.length < 7) return null;

  const m = ctx.mobile;
  const [S, o, u, r, a] = line1;
  const c = line2[5];
  const k = line2[6];
  const h = S.height; // height of one line of the name
  const pts: Pt[] = [];
  const under: Box[] = [];

  /** a point inside a letter's box: fx/fy are fractions of its width/height */
  const P = (b: Box, fx: number, fy: number): Pt => ({ x: b.left + b.width * fx, y: b.top + b.height * fy });

  // Never cross the portrait (desktop: it sits right of the name)
  const maxX = !m && photo ? photo.left - 20 : ctx.width - 8;
  const safeX = (x: number) => Math.min(Math.max(x, 10), maxX);

  // ◎ 1 — start ring, just left of the "S", under "I AM"
  const start = { x: Math.max(14, S.left - 0.04 * h), y: S.top + 0.06 * h };
  pts.push(start);
  const rings = [0];

  // 2 — down the left of the S, then hook into its middle and out at the top right
  pts.push({ x: Math.max(10, S.left - 0.07 * h), y: S.top + 0.42 * h });
  pts.push(P(S, 0.22, 0.66));
  pts.push(P(S, 0.5, 0.52));
  pts.push(P(S, 0.86, 0.4));

  // 3 — behind the left side of the "o", through its middle, out in front at the bottom right
  pts.push(P(o, 0.14, 0.47));
  under.push(rect(o.left, o.top + 0.38 * h, o.width * 0.3, 0.2 * h));
  pts.push(P(o, 0.5, 0.62));
  pts.push(P(o, 0.9, 0.8));

  // 4 — straight along the bottom of "u" and "r"
  const lowY = o.top + 0.8 * h;
  pts.push({ x: u.left + u.width * 0.3, y: lowY });
  pts.push({ x: u.right, y: lowY });
  pts.push({ x: r.left + r.width * 0.55, y: lowY });

  // 5 — up over the top of the "r" and "a"…
  pts.push(P(r, 0.92, 0.42));
  pts.push(P(r, 1.0, 0.16));
  pts.push(P(a, 0.45, 0.1));
  pts.push(P(a, 0.8, 0.26));

  // …then coil twice round the "a"'s right-hand stem
  const stemX = a.left + a.width * 0.82;
  const stemHalf = a.width * 0.2;
  const ac = coil({
    axis: "y",
    at: stemX,
    from: a.top + 0.42 * h,
    to: a.top + 0.74 * h,
    r: stemHalf + Math.max(5, 0.08 * h),
    turns: m ? 1 : 2,
    strokeHalf: stemHalf,
    tilt: Math.max(4, 0.075 * h),
  });
  pts.push(...ac.pts);
  under.push(...ac.under.map((q) => rect(q.left, q.top, q.width, q.height)));

  // 6 — down-left out of the "a" into the gap between the two words
  const g0 = S.top + 0.885 * h; // bottom of "Sourav"
  const g1 = line2[0].top + 0.07 * h; // top of "Mallick"
  const y1 = lerp(g0, g1, 0.3);
  const y2 = lerp(g0, g1, 0.78);
  pts.push(P(a, 0.3, 0.92));
  pts.push({ x: r.cx, y: y1 });

  // 7 — hairpin: left along the gap, a tight U-turn, and back right
  const hx = Math.max(12, S.left - 0.07 * h);
  pts.push({ x: u.cx, y: y1 }, { x: o.cx, y: y1 }, { x: S.cx, y: y1 });
  pts.push({ x: hx + 6, y: y1 }, { x: hx, y: (y1 + y2) / 2 }, { x: hx + 6, y: y2 });
  pts.push({ x: S.cx, y: y2 }, { x: line2[1].cx, y: y2 }, { x: line2[3].cx, y: y2 }, { x: c.left, y: y2 });

  // 8 — loop round the "k": over its arm, round the right, back left
  //     (behind its stem), curl down
  pts.push(P(k, 0.42, 0.2));
  pts.push({ x: safeX(k.right + 0.07 * h), y: k.top + 0.3 * h });
  pts.push({ x: safeX(k.right - 0.02 * k.width), y: k.top + 0.47 * h });
  pts.push(P(k, 0.55, 0.47));
  pts.push(P(k, 0.15, 0.46));
  under.push(rect(k.left - 2, k.top + 0.4 * h, k.width * 0.34, 0.13 * h));
  pts.push({ x: k.left - 0.07 * h, y: k.top + 0.5 * h });

  // 9 — down to the "c" and coil round the end of its lower stroke
  const cx0 = c.left + c.width * 0.84;
  const cHalf = c.width * 0.1;
  pts.push(P(c, 0.98, 0.56));
  const cc = coil({
    axis: "y",
    at: cx0,
    from: c.top + 0.62 * h,
    to: c.top + 0.86 * h,
    r: cHalf + Math.max(5, 0.07 * h),
    turns: m ? 1 : 1.5,
    strokeHalf: cHalf,
    tilt: Math.max(4, 0.06 * h),
  });
  pts.push(...cc.pts);
  under.push(...cc.under.map((q) => rect(q.left, q.top, q.width, q.height)));

  // 10 — a little spring dropping to the ◎ end ring (just above the tagline)
  const last = pts[pts.length - 1];
  const springTop = { x: last.x, y: Math.max(last.y, c.bottom) + 4 };
  const endY = tag.top - Math.max(14, 0.12 * h);
  pts.push(springTop);
  pts.push(...spring(springTop, Math.max(16, endY - springTop.y), m ? 3 : 4, m ? 4 : 6));
  rings.push(pts.length - 1);
  const heroEnd = pts.length - 1;
  const end = pts[heroEnd];

  // ---- after the end ring the thread carries on (on scroll) to the next section
  if (!m) {
    // right, above the tagline, then down past its end and sweep toward the funnel
    const floor = Math.max(tag.bottom, photo?.bottom ?? 0);
    const sweepY = floor + Math.max(24, (hero.bottom - floor) * 0.45);
    const gx = Math.max(tag.right + 30, end.x + 60);
    pts.push({ x: end.x + 24, y: end.y + 2 });
    pts.push({ x: gx, y: end.y + 8 });
    pts.push({ x: gx + 14, y: sweepY - 10 });
    pts.push({ x: ctx.width * 0.68, y: sweepY + 10 });
  } else {
    // left, above the tagline, down the left gutter beside the photo, then right under it
    const gx = 9;
    pts.push({ x: end.x - 24, y: end.y + 2 });
    pts.push({ x: gx + 10, y: end.y + 8 });
    pts.push({ x: gx, y: tag.bottom });
    if (photo) pts.push({ x: gx, y: photo.cy });
    const sweepY = (photo?.bottom ?? tag.bottom) + 30;
    pts.push({ x: gx + 22, y: sweepY });
    pts.push({ x: ctx.width * 0.5, y: sweepY + 16 });
    pts.push({ x: ctx.width - 9, y: sweepY + 46 });
  }

  return { points: pts, under, rings, markers: { heroEnd } };
};

/* ------------------------------------------------------------------ */
/* 2. FUNNEL — tangle → walls → rings → node → three branches          */
/* ------------------------------------------------------------------ */
export const funnelSegment: Segment = (ctx) => {
  const F = ctx.box("funnel");
  if (!F) return null;

  const w = F.width;
  const H = F.height;
  const X = (fx: number) => F.left + fx * w;
  const Y = (fy: number) => F.top + fy * H;
  const rand = seeded(FUNNEL.tangle.seed);

  const cx = X(FUNNEL.cx);
  const rimY = Y(FUNNEL.rim.y);
  const neckY = Y(FUNNEL.neck.y);
  const rimHalf = FUNNEL.rim.half * w;
  const neckHalf = FUNNEL.neck.half * w;
  /** funnel half-width at height y */
  const halfAt = (y: number) => lerp(rimHalf, neckHalf, (y - rimY) / (neckY - rimY));

  const tc: Pt = { x: cx, y: Y(FUNNEL.tangle.y) };
  const rx = FUNNEL.tangle.rx * w;
  const ry = FUNNEL.tangle.ry * H;

  const pts: Pt[] = [];
  const markers: Record<string, number> = {};

  // a. entry — on mobile come down the right-hand gutter first
  if (ctx.mobile) pts.push({ x: ctx.width - 9, y: F.top - 0.1 * H });
  // a loose hanging string dropping into the tangle
  const top = tc.y - ry;
  pts.push(
    { x: cx + 0.06 * w, y: top - 0.075 * H },
    { x: cx - 0.03 * w, y: top - 0.035 * H },
  );

  // b. the raw-data tangle (draws first)
  const rimRight: Pt = { x: cx + rimHalf, y: rimY };
  pts.push(...scribble(tc, rx, ry, FUNNEL.tangle, rand, { x: cx + 0.01 * w, y: top }, rimRight));
  markers.raw = pts.length - 1;

  // c. right wall down to the neck…
  const wallStart = pts.length;
  const rightWall = wobblyLine(rimRight, { x: cx + neckHalf, y: neckY }, 9, FUNNEL.wobble, rand);
  pts.push(...rightWall.slice(1));
  // …a tiny turn at the neck, and back up the left wall
  pts.push({ x: cx, y: neckY + 3 });
  const rimLeft: Pt = { x: cx - rimHalf, y: rimY };
  pts.push(...wobblyLine({ x: cx - neckHalf, y: neckY }, rimLeft, 9, FUNNEL.wobble, rand));

  // d. the rings: spiral down inside the funnel to the neck
  pts.push(...spiral(cx, rimY, neckY, halfAt, FUNNEL.spiralTurns));

  // e. single line down to the Insight node
  const nodeY = Y(FUNNEL.node.y);
  const r = FUNNEL.node.r;
  pts.push(
    { x: cx + 1, y: neckY + 0.03 * H },
    { x: cx - 1.5, y: (neckY + nodeY) / 2 },
    { x: cx, y: nodeY - r - 6 },
    { x: cx, y: nodeY - r },
  );
  markers.insight = pts.length - 1;

  // ---- labels + leader lines (positions come from the real label elements)
  const connectors: Connector[] = [];
  const raw = ctx.box("label-raw");
  if (raw) {
    const k = Math.max(0, 1 - ((raw.cy - tc.y) / ry) ** 2);
    connectors.push({ id: "raw", from: { x: cx + rx * Math.sqrt(k) * 0.9, y: raw.cy }, to: { x: raw.left - 10, y: raw.cy } });
  }
  const pipe = ctx.box("label-pipeline");
  if (pipe) {
    connectors.push({ id: "pipeline", from: { x: cx + halfAt(pipe.cy) + 3, y: pipe.cy }, to: { x: pipe.left - 10, y: pipe.cy } });
    // fade the label in when the thread passes that height on the right wall
    let best = 0;
    rightWall.forEach((p, i) => {
      if (Math.abs(p.y - pipe.cy) < Math.abs(rightWall[best].y - pipe.cy)) best = i;
    });
    markers.pipeline = wallStart + Math.max(0, best - 1);
  }
  const ins = ctx.box("label-insight");
  if (ins) {
    connectors.push({ id: "insight", from: { x: cx + r + 4, y: nodeY }, to: { x: ins.left - 10, y: ins.cy } });
  }

  // ---- three branches from the node to the items
  const forkY = Y(FUNNEL.forkY);
  const start = nodeY + r;
  const branches = ctx.boxes("funnel-item").map((it) => {
    const end = { x: it.cx, y: it.top - 12 };
    const dy = end.y - forkY;
    const d =
      Math.abs(end.x - cx) < 2
        ? `M${cx},${start} L${end.x},${end.y}`
        : `M${cx},${start} L${cx},${forkY} C${cx},${forkY + dy * 0.55} ${end.x},${forkY + dy * 0.2} ${end.x},${forkY + dy * 0.8} L${end.x},${end.y}`;
    return { d, end };
  });

  return {
    points: pts,
    markers,
    connectors,
    node: { at: { x: cx, y: nodeY }, r },
    branches,
  };
};

/** The route, in page order. Add new section segments here. */
export const SEGMENTS: Segment[] = [heroSegment, funnelSegment];
