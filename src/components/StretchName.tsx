"use client";

import { useLayoutEffect, useRef } from "react";

type Line = { word: string; anchor: string };

/**
 * The big two-line name. Each line is stretched sideways so it runs the full
 * width of its column (right up to the photo), filling the empty space —
 * while its height still fits the screen.
 *
 * Each letter is its own <span data-thread="…"> so the thread can weave
 * through them.
 */
export default function StretchName({ lines, className = "", maxStretch = 1.9 }: { lines: Line[]; className?: string; maxStretch?: number }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const h1 = ref.current;
    if (!h1) return;

    const fit = () => {
      const available = h1.clientWidth;
      h1.querySelectorAll<HTMLElement>("[data-stretch]").forEach((inner) => {
        inner.style.transform = "none";
        const natural = inner.offsetWidth || 1;
        const k = Math.min(maxStretch, Math.max(0.75, available / natural));
        inner.style.transform = `scaleX(${k})`;
      });
      // let the thread re-measure the stretched letters
      window.dispatchEvent(new Event("resize"));
    };

    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(h1);
    return () => ro.disconnect();
  }, [maxStretch]);

  return (
    <h1 ref={ref} aria-label={lines.map((l) => l.word).join(" ")} className={className}>
      {lines.map((l) => (
        <span key={l.anchor} className="block" aria-hidden>
          <span data-stretch className="inline-block origin-left whitespace-nowrap">
            {l.word.split("").map((ch, i) => (
              <span key={i} data-thread={l.anchor} className="inline-block">
                {ch}
              </span>
            ))}
          </span>
        </span>
      ))}
    </h1>
  );
}
