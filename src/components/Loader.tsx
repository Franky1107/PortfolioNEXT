"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Loading screen: a black screen that flashes a greeting in several
 * languages (from the original portfolio), then closes upwards.
 * When it starts closing it tells the rest of the page (the thread waits
 * for this before drawing itself) via the "loader:done" event.
 *
 * The greetings are plain CSS animations (see globals.css), so they start
 * with the very first paint and keep going round while the page's JavaScript
 * is still loading. The code below only ends it: once every greeting has been
 * shown AND the page is ready, the round stops on the next greeting, pauses
 * for a moment and the screen closes.
 */
const WORDS = ["Hello", "Bonjour", "Hola", "Ciao", "Привет", "你好", "こんにちは", "नमस्ते", "ନମସ୍କାର"];
const LANGS = ["en", "fr", "es", "it", "ru", "zh", "ja", "hi", "or"];
const WORD_MS = 250; // time each greeting is shown
const START_MS = 350; // "Hello" stays a little longer at the start
const HOLD_MS = 200; // pause on the final greeting before the screen closes
const CLOSE_MS = 700; // closing animation (matches the CSS)
const ROUND_MS = WORDS.length * WORD_MS; // one full round of greetings
const OUT_MS = 200; // a greeting's exit (matches the CSS)

// Each greeting's place in the round. "Hello" is on screen from the start, so
// it first only leaves (after START_MS) and joins the round at the end of it.
const wordTiming = (i: number): React.CSSProperties =>
  i === 0
    ? { animationDelay: `${START_MS}ms, ${START_MS + ROUND_MS - WORD_MS}ms`, animationDuration: `${OUT_MS}ms, ${ROUND_MS}ms` }
    : { animationDelay: `${START_MS + (i - 1) * WORD_MS}ms`, animationDuration: `${ROUND_MS}ms` };

export default function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState<number | null>(null); // the greeting it stopped on
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
    const html = document.documentElement;
    html.style.overflow = "hidden"; // no scrolling while loading

    // Always start at the top: stop the browser restoring the old scroll
    // position on refresh (it would show once the loader closes)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    // ...and drop any "#section" from the URL: a refresh always opens the homepage
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    toTop();

    const finish = () => {
      toTop();
      setClosing(true);
      html.style.overflow = "";
      html.dataset.loaded = "1";
      window.dispatchEvent(new Event("loader:done"));
      later(() => {
        setGone(true);
        html.dataset.loaderGone = "1";
        window.dispatchEvent(new Event("loader:gone"));
      }, CLOSE_MS + 50);
    };

    const words = Array.from(ref.current?.querySelectorAll<HTMLElement>(".loader-word") ?? []);
    const rounds = (w: HTMLElement) => (w.getAnimations?.() ?? []).filter((a) => (a as CSSAnimation).animationName === "loader-word");

    // Close the screen, showing only the greeting that is on screen right now
    const end = () => {
      let showing = 0;
      let most = -1;
      words.forEach((w, i) => {
        const o = Number(getComputedStyle(w).opacity);
        if (o > most) {
          most = o;
          showing = i;
        }
      });
      setHeld(showing);
      finish();
    };

    let raf = 0;
    if (!words.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish(); // reduced motion: just "Hello", no greetings to wait for
    } else {
      // (in the next frame, when the browser's animation clock is up to date)
      raf = requestAnimationFrame(() => {
        // The greetings have been going round in CSS since the first paint,
        // however long the page's JavaScript took to get here — ask the
        // browser how long that is.
        const clock = rounds(words[words.length - 1])[0];
        const elapsed = Number(clock?.currentTime);
        if (!clock || !Number.isFinite(elapsed)) {
          later(end, ROUND_MS); // a browser too old to say: one more round, then close
          return;
        }
        // Greeting number k (counting on through the rounds) is fully in at
        // START_MS + k × WORD_MS. Stop at the first such moment from now on —
        // but not before the last greeting of the first round has had its turn.
        const k = Math.max(WORDS.length - 1, Math.ceil((elapsed - START_MS) / WORD_MS));
        const stopAt = START_MS + k * WORD_MS;
        // Tell every greeting's animation to freeze exactly then: the one whose
        // turn it is stays fully in, the others are out of sight. (The browser
        // does the stopping, so it is exact even if the page is busy.)
        for (const w of words) {
          for (const a of rounds(w)) {
            const delay = Number(a.effect?.getComputedTiming().delay) || 0;
            a.effect?.updateTiming({ iterations: Math.max(0, (stopAt - delay) / ROUND_MS), fill: "forwards" });
          }
        }
        later(end, stopAt - elapsed + HOLD_MS);
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      html.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={ref}
      id="loader"
      className={closing ? "is-closing" : ""}
      role="status"
      aria-label="Loading"
      aria-hidden={closing}
    >
      <div className="loader-words">
        {WORDS.map((w, i) => (
          <span
            key={w}
            lang={LANGS[i]}
            className={`loader-word ${held === null ? "" : i === held ? "is-held" : "is-out"}`}
            style={wordTiming(i)}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
