"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Hello" splash transition (carried over from the original portfolio).
 * Clicking any in-page link (href="#…") opens a black screen from the middle,
 * flashes a greeting in several languages, jumps to the section behind it,
 * then closes again.
 */
const WORDS = ["Hello", "Bonjour", "Hola", "Ciao", "Привет", "你好", "こんにちは", "नमस्ते", "ନମସ୍କାର"];
const WORD_MS = 250; // time per word
const CLOSE_MS = 600; // closing animation

type Phase = "idle" | "open" | "closing";

export default function NavSplash() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [word, setWord] = useState(-1);
  const busy = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const jump = (hash: string) => {
      const target = hash === "#top" || hash === "#" ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
      const top = target ? target.getBoundingClientRect().top + window.scrollY : 0;
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      const hash = a?.getAttribute("href");
      if (!a || !hash || !hash.startsWith("#")) return;
      if (hash !== "#" && hash !== "#top" && !document.getElementById(decodeURIComponent(hash.slice(1)))) return;
      e.preventDefault();

      // people who prefer less motion: just jump
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return jump(hash);
      if (busy.current) return;
      busy.current = true;

      setPhase("open");
      setWord(0);
      WORDS.forEach((_, i) => i > 0 && later(() => setWord(i), i * WORD_MS));
      // after the last word: jump while the screen is still covering the page, then close
      later(() => {
        setWord(WORDS.length); // last word exits
        jump(hash);
        later(() => {
          setPhase("closing");
          later(() => {
            setPhase("idle");
            setWord(-1);
            busy.current = false;
          }, CLOSE_MS);
        }, 200);
      }, WORDS.length * WORD_MS);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={`nav-splash ${phase === "open" ? "active" : ""} ${phase === "closing" ? "closing" : ""}`} aria-hidden={phase === "idle"}>
      <div className="nav-splash-inner">
        {WORDS.map((w, i) => (
          <span key={w} lang={["en", "fr", "es", "it", "ru", "zh", "ja", "hi", "or"][i]} className={`splash-word ${i === word ? "active" : ""} ${i < word ? "exit" : ""}`}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
