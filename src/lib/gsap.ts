/**
 * One place to register GSAP plugins. Import gsap (and the plugins) from here
 * in client components so every plugin is registered exactly once:
 *
 *   import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, ScrollToPlugin, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, ScrollToPlugin, useGSAP };

/** Sections can override where "#id" links land, e.g. About → the end of its pin. */
export const navTargets: Record<string, () => number> = {};

/** Slow, smooth scroll to a y position; longer trips take a little longer.
    Any wheel/touch by the visitor cancels it. Instant with reduced motion. */
export function smoothScrollTo(y: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, y);
    return;
  }
  const duration = gsap.utils.clamp(1.2, 2.8, 0.9 + Math.abs(y - window.scrollY) / 5000);
  gsap.to(window, { scrollTo: { y, autoKill: true }, duration, ease: "power3.inOut", overwrite: true });
}
