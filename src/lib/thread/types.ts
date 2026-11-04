export type Pt = { x: number; y: number };

/** An element's rectangle, in px, relative to the top-left of <Thread>. */
export type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

/** What a segment builder can ask about the page. */
export interface ThreadContext {
  /** First element with data-thread="name" (or null if not on the page) */
  box(name: string): Box | null;
  /** Every element with data-thread="name", in page order */
  boxes(name: string): Box[];
  /** Size of the whole <Thread> area */
  width: number;
  height: number;
  /** True below THREAD.mobileBreakpoint */
  mobile: boolean;
}

/** A thin white leader line from the thread to a label. */
export interface Connector {
  id: string; // matches data-thread-label="id" and a marker name
  from: Pt; // on the thread
  to: Pt; // just left of the label
}

export interface Branch {
  d: string; // SVG path
  end: Pt; // where the end-dot goes
}

/**
 * What each section contributes to the thread.
 * `points` are joined (in order) with the previous segments' points and
 * smoothed into one continuous curve.
 */
export interface SegmentResult {
  points: Pt[];
  /** name → index into THIS segment's points (used for label timing) */
  markers?: Record<string, number>;
  /**
   * Rectangles where the thread goes BEHIND the content (e.g. behind one stroke
   * of a letter). Everywhere else the thread is drawn in front.
   */
  under?: Box[];
  /** Point indices (into this segment's points) that get a ring-dot ◎ */
  rings?: number[];
  connectors?: Connector[];
  /** A glowing node at the end of the main thread */
  node?: { at: Pt; r: number };
  /** Paths drawn simultaneously after the main thread completes */
  branches?: Branch[];
  /** A path drawn after the branches — the thread carrying on to the next section */
  tail?: string;
}

/** A function that reads the page and returns its piece of the thread. */
export type Segment = (ctx: ThreadContext) => SegmentResult | null;
