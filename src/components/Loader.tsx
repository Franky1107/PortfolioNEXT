"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Loading screen (carried over from the original portfolio).
 * Counts 0 → 100%, holds for a moment, then slides up out of the way.
 * When it starts sliding it tells the rest of the page (the thread waits
 * for this before drawing itself) via the "loader:done" event.
 */
const COUNT_MS = 800; // how long the 0 → 100% count takes
const HOLD_MS = 1000; // how long 100% stays on screen
const SLIDE_MS = 800; // the slide-up transition (matches the CSS)

export default function Loader() {
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    document.documentElement.style.overflow = "hidden"; // no scrolling while loading

    // Always start at the top: stop the browser restoring the old scroll
    // position on refresh (it would show once the loader slides away)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    toTop();

    const finish = () => {
      toTop();
      setHidden(true);
      document.documentElement.style.overflow = "";
      // a link like /#projects still jumps to its section once loading is done
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView();
      document.documentElement.dataset.loaded = "1";
      window.dispatchEvent(new Event("loader:done"));
      timers.push(setTimeout(() => setGone(true), SLIDE_MS + 50));
    };

    if (reduce) {
      finish();
      return () => timers.forEach(clearTimeout);
    }

    let pct = 0;
    const step = 20;
    const inc = 100 / (COUNT_MS / step);
    const tick = setInterval(() => {
      pct += inc;
      if (Math.random() > 0.8) pct += Math.random() * 5; // a little natural variation
      if (pct >= 100) {
        pct = 100;
        clearInterval(tick);
        timers.push(setTimeout(finish, HOLD_MS));
      }
      if (barRef.current) barRef.current.style.width = `${pct}%`;
      if (pctRef.current) pctRef.current.textContent = `${Math.floor(pct)}%`;
    }, step);

    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div id="loader" className={hidden ? "is-hidden" : ""} aria-hidden={hidden} role="status" aria-label="Loading">
      <div className="loader-content">
        <span className="loader-name">
          Sourav
          <br />
          Mallick
        </span>
        <div className="loader-line-wrap">
          <div className="loader-line" ref={barRef} />
        </div>
        <span className="loader-pct" ref={pctRef}>
          0%
        </span>
      </div>

      {/* Spinner: from Uiverse.io by Praashoo7 */}
      <div className="loader-spinner" aria-hidden>
        <div className="loaders">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="loader-bar" />
          ))}
        </div>
        <div className="loadersB">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="loaderA">
              <div className="loader-ball" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
