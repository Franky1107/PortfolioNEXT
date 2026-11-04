import { HELIX } from "./config";

/**
 * Where the helix sits (shared by the helix itself and by the funnel thread,
 * which runs down to meet it). x values are page x (same as viewport x).
 * Returns null on phones or if the work section isn't on the page.
 */
export function helixAnchor() {
  if (typeof window === "undefined") return null;
  const left = document.querySelector<HTMLElement>("[data-helix-left]");
  const right = document.querySelector<HTMLElement>("[data-helix-right]");
  if (!left || !right) return null;
  const l = left.getBoundingClientRect();
  const r = right.getBoundingClientRect();
  if (r.left <= l.right) return null; // stacked (phone layout)
  const R = Math.min(HELIX.radiusMax, Math.max(HELIX.radiusMin, window.innerWidth * HELIX.radiusVw));
  const cx = (l.right + r.left) / 2;
  return { cx, R, entryX: cx - R };
}
