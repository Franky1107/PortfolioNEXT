/**
 * THREAD SETTINGS — the knobs you are most likely to tweak.
 * (Colour lives in src/app/globals.css → --accent.)
 */
export const THREAD = {
  /** Thread thickness in px (desktop / mobile) */
  strokeWidth: 2.6,
  strokeWidthMobile: 2.2,

  /** Below this window width the mobile layout + simpler path is used */
  mobileBreakpoint: 768,

  /**
   * Where the drawing tip tries to sit, as a fraction of the screen height.
   * 0.85 = the tip runs ~85% of the way down the screen, so each part is
   * finished while it is still in view.
   */
  followAt: 0.85,

  /**
   * Minimum scroll distance (px) per px of thread. Raise it to make dense
   * parts (the letter weave, the tangle) draw more slowly.
   */
  minScrollPerPx: 0.03,

  /** How many px of scrolling the three end branches take to draw */
  branchScroll: 140,

  /** How long (in px of thread) a label takes to fade in after the tip passes */
  labelFade: 90,

  /**
   * The part of the thread up to this marker (the whole hero) draws itself
   * automatically when the page loads, over introDuration seconds.
   */
  introMarker: "heroEnd",
  introDuration: 1.8,

  /** Precision of the scroll → length lookup (px of thread per sample) */
  sampleStep: 6,
} as const;

/**
 * FUNNEL LAYOUT — every value is a fraction of the funnel box
 * (x = fraction of its width, y = fraction of its height).
 * Used both by the HTML (label / item positions) and by the thread path,
 * so they always line up.
 */
export const FUNNEL = {
  /** horizontal centre of the funnel */
  cx: 0.4,

  /** the raw-data scribble at the top */
  tangle: { y: 0.15, rx: 0.26, ry: 0.1, loops: 16, points: 260, seed: 7 },

  /** funnel mouth (top) and neck (bottom); "half" = half-width */
  rim: { y: 0.27, half: 0.23 },
  neck: { y: 0.5, half: 0.012 },

  /** rings: the thread loops round the funnel this many times on its way down
      (first ring = the funnel mouth) */
  spiralTurns: 3,

  /** wall wobble in px (keep it subtle) */
  wobble: 1.3,

  /** the "Insight" node (r in px) */
  node: { y: 0.6, r: 13 },

  /** where the stem splits, and where the three items sit */
  forkY: 0.67,
  itemY: 0.81,
  itemDx: [-0.28, 0, 0.28],

  /** labels: left edge (x) and vertical centre of each title (y) */
  labelX: 0.66,
  labelY: { raw: 0.12, pipeline: 0.37, insight: 0.6 },
} as const;
