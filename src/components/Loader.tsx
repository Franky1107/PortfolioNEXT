"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Loading screen: a black screen that flashes a greeting in several
 * languages (from the original portfolio), then closes upwards.
 * When it starts closing it tells the rest of the page (the thread waits
 * for this before drawing itself) via the "loader:done" event.
 *
 * The greetings are plain CSS animations (see globals.css), so they start
 * with the very first paint — while the page's JavaScript is still loading.
 * The code below only closes the screen: as soon as the greetings have
 * played AND the page is ready, whichever comes last.
 */
const WORDS = ["Hello", "Bonjour", "Hola", "Ciao", "Привет", "你好", "こんにちは", "नमस्ते", "ନମସ୍କାର"];
const LANGS = ["en", "fr", "es", "it", "ru", "zh", "ja", "hi", "or"];
const WORD_MS = 250; // time each greeting is shown
const START_MS = 350; // "Hello" stays a little longer at the start
const HOLD_MS = 200; // pause after the last word
const CLOSE_MS = 700; // closing animation (matches the CSS)
// when the greetings are over, counted from the first paint
const GREET_MS = START_MS + (WORDS.length - 1) * WORD_MS + HOLD_MS;
// when each word comes in and goes out (the first is there from the start, the last one stays)
const wordTimes = (i: number) => `${START_MS + (i - 1) * WORD_MS}ms, ${START_MS + i * WORD_MS}ms`;

export default function Loader() {
  const ref = useRef<HTMLDivElement>(null);
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

    // The greetings have been playing in CSS since the first paint. #loader
    // carries a silent "clock" animation that ends when they are over — wait
    // for whatever is left of it (nothing, if the page took longer than the
    // greetings), then close. With reduced motion there is no clock: close now.
    let cancelled = false;
    const el = ref.current;
    if (el && !el.getAnimations) {
      later(finish, GREET_MS); // very old browser: just wait the full time
    } else {
      const clock = (el?.getAnimations() ?? []).filter((a) => (a as CSSAnimation).animationName === "loader-clock");
      const go = () => {
        if (!cancelled) finish();
      };
      Promise.all(clock.map((a) => a.finished)).then(go, go);
    }

    return () => {
      cancelled = true;
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
      style={{ animationDuration: `${GREET_MS}ms` }}
      role="status"
      aria-label="Loading"
      aria-hidden={closing}
    >
      <div className="loader-words">
        {WORDS.map((w, i) => (
          <span key={w} lang={LANGS[i]} className="loader-word" style={{ animationDelay: wordTimes(i) }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
