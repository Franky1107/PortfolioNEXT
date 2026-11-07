"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * INFINITE PHOTO ACCORDION MARQUEE
 * A strip of photos drifting right → left forever. Hover / focus (or tap on
 * touch screens) a photo: it widens like an accordion, gets its colour back
 * and shows its caption, while the strip glides to a stop. Leave: it eases back.
 *
 * Loop: the photo set is rendered twice in one flex track and the track's
 * xPercent tweens 0 → -50 on repeat. Every card carries its own right margin,
 * so each half is exactly one set wide and the seam never shows. xPercent is
 * relative to the live track width, so it stays exact while widths change.
 */
export type MarqueeImage = { src: string; alt: string; caption?: string };

type Props = {
  images: MarqueeImage[];
  speed?: number; // px per second
  height?: number; // px; default 260 on phones, 380 from md up
  collapsedWidth?: number;
  expandedWidth?: number;
  gap?: number;
  pauseOnHover?: boolean;
};

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function PhotoAccordionMarquee({
  images,
  speed = 40,
  height,
  collapsedWidth = 160,
  expandedWidth = 480,
  gap = 12,
  pauseOnHover = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const reduce = useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, () => false);

  // how many times one "set" repeats the images so a set is at least a viewport wide
  // (two sets back to back then cover ≥ 2× the viewport)
  const [repeat, setRepeat] = useState(1);
  const setWidth = images.length * repeat * (collapsedWidth + gap);
  useEffect(() => {
    const fit = () => setRepeat(Math.max(1, Math.ceil(window.innerWidth / (images.length * (collapsedWidth + gap)))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [images.length, collapsedWidth, gap]);

  // which card is held open by a tap (touch screens have no hover)
  const [openKey, setOpenKey] = useState<string | null>(null);
  const lastPointer = useRef("mouse");

  /* the endless drift ------------------------------------------------ */
  useGSAP(
    () => {
      if (reduce || !trackRef.current) return;
      tween.current = gsap.fromTo(trackRef.current, { xPercent: 0 }, { xPercent: -50, duration: setWidth / speed, ease: "none", repeat: -1 });
      return () => {
        tween.current = null;
      };
    },
    { scope: rootRef, dependencies: [reduce, setWidth, speed], revertOnUpdate: true },
  );

  // glide to a stop / back to speed (timeScale, not an abrupt pause)
  const holding = useRef({ hover: false, focus: false });
  const glide = () => {
    const t = tween.current;
    if (!t || !pauseOnHover) return;
    const stop = holding.current.hover || holding.current.focus || openKey !== null;
    gsap.to(t, { timeScale: stop ? 0 : 1, duration: stop ? 0.5 : 0.8, ease: "power2.out", overwrite: true });
  };
  useEffect(glide); // also re-evaluates when a tap opens/closes a card

  // save CPU: no drifting while the strip is off screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => tween.current?.paused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, setWidth]);

  const sets = reduce ? 1 : 2;
  const cards = Array.from({ length: sets * repeat }, (_, r) => images.map((img, i) => ({ img, key: `${r}-${i}`, dup: r >= repeat }))).flat();

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${reduce ? "overflow-x-auto" : "overflow-hidden"} ${height ? "" : "h-[260px] md:h-[380px]"}`}
      style={{
        height,
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        ["--cw" as string]: `${collapsedWidth}px`,
        ["--ew" as string]: `min(${expandedWidth}px, 85vw)`,
      }}
      onPointerEnter={(e) => {
        lastPointer.current = e.pointerType;
        if (e.pointerType === "mouse") {
          holding.current.hover = true;
          glide();
        }
      }}
      onPointerLeave={() => {
        holding.current.hover = false;
        glide();
      }}
      onFocus={() => {
        holding.current.focus = true;
        glide();
      }}
      onBlur={() => {
        holding.current.focus = false;
        glide();
      }}
    >
      <div ref={trackRef} className="flex h-full w-max">
        {cards.map(({ img, key, dup }) => {
          const open = openKey === key;
          return (
            <figure
              key={key}
              aria-hidden={dup || undefined}
              tabIndex={dup ? -1 : 0}
              data-open={open}
              onPointerDown={(e) => (lastPointer.current = e.pointerType)}
              onClick={() => lastPointer.current !== "mouse" && setOpenKey(open ? null : key)}
              className="group relative h-full w-[var(--cw)] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-[#111] outline-none transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:w-[var(--ew)] focus-visible:w-[var(--ew)] focus-visible:ring-2 focus-visible:ring-accent data-[open=true]:w-[var(--ew)]"
              style={{ marginRight: gap }}
            >
              <Image
                src={img.src}
                alt={dup ? "" : img.alt}
                fill
                sizes={`${expandedWidth}px`}
                loading="lazy"
                className="object-cover brightness-[0.65] grayscale transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:brightness-100 group-hover:grayscale-0 group-focus-visible:scale-105 group-focus-visible:brightness-100 group-focus-visible:grayscale-0 group-data-[open=true]:scale-105 group-data-[open=true]:brightness-100 group-data-[open=true]:grayscale-0"
              />
              {img.caption && (
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 font-mono text-[11px] uppercase tracking-[0.12em] text-white opacity-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 group-data-[open=true]:translate-y-0 group-data-[open=true]:opacity-100">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}
