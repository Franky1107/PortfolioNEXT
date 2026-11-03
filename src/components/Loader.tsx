"use client";

import { useEffect, useState } from "react";

/**
 * Loading screen: a black screen that flashes a greeting in several
 * languages (from the original portfolio), then closes upwards.
 * When it starts closing it tells the rest of the page (the thread waits
 * for this before drawing itself) via the "loader:done" event.
 */
const WORDS = ["Hello", "Bonjour", "Hola", "Ciao", "Привет", "你好", "こんにちは", "नमस्ते", "ନମସ୍କାର"];
const LANGS = ["en", "fr", "es", "it", "ru", "zh", "ja", "hi", "or"];
const WORD_MS = 250; // time each greeting is shown
const START_MS = 350; // "Hello" stays a little longer at the start
const HOLD_MS = 200; // pause after the last word
const CLOSE_MS = 700; // closing animation (matches the CSS)

export default function Loader() {
  const [word, setWord] = useState(0);
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
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    toTop();

    const finish = () => {
      toTop();
      setClosing(true);
      html.style.overflow = "";
      // a link like /#projects still jumps to its section once loading is done
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView();
      html.dataset.loaded = "1";
      window.dispatchEvent(new Event("loader:done"));
      later(() => {
        setGone(true);
        html.dataset.loaderGone = "1";
        window.dispatchEvent(new Event("loader:gone"));
      }, CLOSE_MS + 50);
    };

    // one word after another (each step waits for the previous one, so a busy
    // moment on a slow device delays the words rather than skipping them)
    const step = (i: number) => {
      setWord(i);
      if (i < WORDS.length - 1) later(() => step(i + 1), WORD_MS);
      else later(finish, WORD_MS + HOLD_MS);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
    } else {
      // "Hello", then the rest of the greetings one after another
      later(() => step(1), START_MS);
    }

    return () => {
      timers.forEach(clearTimeout);
      html.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div id="loader" className={closing ? "is-closing" : ""} role="status" aria-label="Loading" aria-hidden={closing}>
      <div className="loader-words">
        {WORDS.map((w, i) => (
          <span key={w} lang={LANGS[i]} className={`loader-word ${i === word ? "active" : ""} ${i < word ? "exit" : ""}`}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
