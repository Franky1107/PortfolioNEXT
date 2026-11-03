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
import { lerp, scribble, seeded, spiral, wobblyLine } from "./geometry";
import type { Box, Connector, Pt, Segment } from "./types";

/* ------------------------------------------------------------------ */
/* 1. HERO — a few calm gestures (drawn automatically on page load):   */
/*    dot after "I AM" → loop round "Sourav" → one long line between   */
/*    the two words → a circle round the "k" → a little squiggle down  */
/* ------------------------------------------------------------------ */
export const heroSegment: Segment = (ctx) => {
  const iam = ctx.box("iam");
  const tag = ctx.box("tagline");
  const hero = ctx.box("hero");
  const photo = ctx.box("photo");
  const line1 = ctx.boxes("name-1"); // letters of "Sourav"
  const line2 = ctx.boxes("name-2"); // letters of "Mallick"
  if (!iam || !tag || !hero || line1.length < 4 || line2.length < 2) return null;

  const m = ctx.mobile;
  const pts: Pt[] = [];
  const h = line1[0].height; // height of one line of the name
  const S = line1[0];
  const o = line1[1];
  const r = line1[3];
  const last1 = line1[line1.length - 1];
  const k = line2[line2.length - 1];

  // Never cross the portrait: on desktop it sits to the right of the text,
  // so the thread may not go further right than the photo's left edge.
  const maxX = !m && photo ? photo.left - 24 : ctx.width - 10;
  const safeX = (x: number) => Math.min(Math.max(x, 8), maxX);

  // The thin gap between "Sourav" and "Mallick"
  const gapY = line2[0].top - 0.02 * h;

  // 1 — start dot just after "I AM"
  pts.push({ x: iam.right + 20, y: iam.cy });

  // 2 — over the top of "Sourav", down through the "o", round the left of the "S"
  pts.push({ x: r.cx, y: S.top + 0.14 * h });
  pts.push({ x: o.cx, y: S.top + 0.6 * h });
  pts.push({ x: Math.max(18, S.left - 0.12 * h), y: S.top + 0.66 * h });

  // 3 — one long, straight line along the gap between the two words
  pts.push({ x: S.cx, y: gapY });
  pts.push({ x: line1[2].cx, y: gapY });
  pts.push({ x: r.right, y: gapY });
  pts.push({ x: last1.left, y: gapY });

  // 4 — a loop round the "k", then down through it
  pts.push({ x: safeX(k.right + 0.16 * h), y: k.top + 0.22 * h });
  pts.push({ x: safeX(k.right + 0.1 * h), y: k.top + 0.72 * h });
  pts.push({ x: k.cx, y: k.bottom + 0.08 * h });
  pts.push({ x: k.left - 0.08 * h, y: k.top + 0.55 * h });
  pts.push({ x: k.cx - 0.05 * h, y: k.top + 0.12 * h });
  const exitX = safeX(k.cx + 0.12 * h);
  pts.push({ x: exitX, y: k.bottom + 0.16 * h });

  // in front of the "o" and the "k"; behind everything else
  const over: Box[] = [o, k];

  if (!m) {
    // Desktop: a small squiggle dropping below the name, then a sweep right
    const floor = Math.max(tag.bottom, photo?.bottom ?? 0);
    const sweepY = floor + Math.max(24, (hero.bottom - floor) * 0.45);
    const drop = sweepY - (k.bottom + 0.16 * h);
    pts.push({ x: exitX - 14, y: k.bottom + 0.16 * h + drop * 0.25 });
    pts.push({ x: exitX + 10, y: k.bottom + 0.16 * h + drop * 0.5 });
    pts.push({ x: exitX - 6, y: k.bottom + 0.16 * h + drop * 0.75 });
    pts.push({ x: exitX + 30, y: sweepY });
    pts.push({ x: ctx.width * 0.68, y: sweepY + 10 });
  } else {
    // Mobile: back left under the name, down the left gutter beside the
    // photo (never across it), then right underneath the photo
    const gx = 9;
    pts.push({ x: k.left, y: k.bottom + 0.3 * h });
    pts.push({ x: line2[1].cx, y: k.bottom + 0.34 * h });
    pts.push({ x: gx + 6, y: tag.top - 6 });
    pts.push({ x: gx, y: tag.bottom });
    if (photo) pts.push({ x: gx, y: photo.cy });
    const sweepY = (photo?.bottom ?? tag.bottom) + 30;
    pts.push({ x: gx + 22, y: sweepY });
    pts.push({ x: ctx.width * 0.5, y: sweepY + 16 });
    pts.push({ x: ctx.width - 9, y: sweepY + 46 });
  }

  // everything up to here is drawn automatically when the page loads
  return { points: pts, over, markers: { heroEnd: pts.length - 1 } };
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
