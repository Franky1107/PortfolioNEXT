"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Project cards slide in tied to your scroll (like the reference site):
 * each card rises up from below, straightens and scales into place as it
 * enters the screen, while its image un-zooms and is revealed from the
 * bottom. Scrolling back up plays it in reverse.
 */
export default function ScrollCards({ children, className = "", helix = false }: { children: React.ReactNode; className?: string; helix?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
        const media = card.querySelector<HTMLElement>(".project-media");
        const inner = card.querySelector<HTMLElement>(".project-media > *");
        const text = card.querySelectorAll<HTMLElement>(".project-text > *");
        const st = { trigger: card, start: "top bottom", end: "top 45%", scrub: 0.6 };

        gsap.fromTo(
          card,
          { yPercent: 28, xPercent: 6, rotate: 2.5, scale: 0.9, opacity: 0.2, transformOrigin: "100% 100%" },
          { yPercent: 0, xPercent: 0, rotate: 0, scale: 1, opacity: 1, ease: "power2.out", scrollTrigger: st },
        );
        if (media) gsap.fromTo(media, { clipPath: "inset(30% 0% 0% 0% round 10px)" }, { clipPath: "inset(0% 0% 0% 0% round 10px)", ease: "power2.out", scrollTrigger: st });
        if (inner) gsap.fromTo(inner, { scale: 1.3 }, { scale: 1, ease: "power2.out", scrollTrigger: st });
        if (text.length) gsap.fromTo(text, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, ease: "power2.out", scrollTrigger: { ...st, start: "top 85%", end: "top 40%" } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} data-helix-right={helix ? "" : undefined}>
      {children}
    </div>
  );
}
