"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** page y of an element's top, ignoring CSS transforms */
const docTop = (el: HTMLElement) => {
  let y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y;
};

/**
 * Project cards slide in tied to your scroll (like the reference site):
 * each card rises up from below, straightens and scales into place as it
 * enters the screen, while its image un-zooms and is revealed from the
 * bottom. Scrolling back up plays it in reverse.
 *
 * SLOWER SCROLL (desktop): the panel has extra empty space at its bottom
 * (its padding-bottom minus padding-top). While the panel is on screen the
 * cards drift down into that space, so they move up slower than the page —
 * the section lasts longer without gaps between the cards.
 */
export default function ScrollCards({
  children,
  className = "",
  innerClassName = "",
  helix = false,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  helix?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    const inner = innerRef.current;
    if (!root || !inner || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // extra length E and the scroll range [s0, s1] over which the cards drift down by E
    const extra = () => {
      const cs = getComputedStyle(root);
      return Math.max(0, parseFloat(cs.paddingBottom) - parseFloat(cs.paddingTop));
    };
    const range = () => {
      const s0 = docTop(root);
      return { s0, s1: s0 + root.offsetHeight - window.innerHeight, E: extra() };
    };
    /** the scroll position at which a card's (untransformed) top sits at viewport y = v */
    const scrollAt = (card: HTMLElement, v: number) => {
      const c = docTop(card);
      const { s0, s1, E } = range();
      const L = s1 - s0;
      if (c - v <= s0 || L <= E) return c - v; // before the drift starts (or nothing to drift)
      const s = (c - v - (E * s0) / L) / (1 - E / L);
      return s <= s1 ? s : c + E - v;
    };
    const at = (card: HTMLElement, frac: number) => () => scrollAt(card, window.innerHeight * frac);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { y: 0 },
        { y: () => extra(), ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true } },
      );

      root.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
        const media = card.querySelector<HTMLElement>(".project-media");
        const img = card.querySelector<HTMLElement>(".project-media > *");
        const text = card.querySelectorAll<HTMLElement>(".project-text > *");
        const st = { start: at(card, 1), end: at(card, 0.45), scrub: 0.6, invalidateOnRefresh: true };

        gsap.fromTo(
          card,
          { yPercent: 28, xPercent: 6, rotate: 2.5, scale: 0.9, opacity: 0.2, transformOrigin: "100% 100%" },
          { yPercent: 0, xPercent: 0, rotate: 0, scale: 1, opacity: 1, ease: "power2.out", scrollTrigger: st },
        );
        if (media) gsap.fromTo(media, { clipPath: "inset(30% 0% 0% 0% round 10px)" }, { clipPath: "inset(0% 0% 0% 0% round 10px)", ease: "power2.out", scrollTrigger: st });
        if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, ease: "power2.out", scrollTrigger: st });
        if (text.length) gsap.fromTo(text, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: "power2.out", scrollTrigger: { ...st, start: at(card, 0.85), end: at(card, 0.4) } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} data-helix-right={helix ? "" : undefined}>
      <div ref={innerRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
