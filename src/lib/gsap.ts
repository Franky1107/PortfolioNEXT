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
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP };
