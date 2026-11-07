"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getServerState, getState, startSound, subscribe } from "@/lib/sound";

// becomes true once the loading screen has fully gone
const subscribeLoaded = (cb: () => void) => {
  window.addEventListener("loader:gone", cb);
  return () => window.removeEventListener("loader:gone", cb);
};
const getLoaded = () => !!document.documentElement.dataset.loaderGone;
const getLoadedServer = () => false;

/**
 * After the loading screen — until the visitor first plays (or turns off) the music — the cursor becomes a small square with
 * "CLICK TO ENABLE SOUND", and clicking (outside links and buttons) turns the
 * music on — in the first (hero) section only; elsewhere the normal cursor
 * shows and clicks do nothing. Mouse / trackpad only — never on touch screens.
 */
export default function CursorPrompt() {
  const { playing, prompt } = useSyncExternalStore(subscribe, getState, getServerState);
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useSyncExternalStore(subscribeLoaded, getLoaded, getLoadedServer);
  // only at the start of each page load: hidden once music has played or been turned off
  const active = loaded && prompt && !playing;

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const el = ref.current;
    if (!fine || !el || !active) return;

    const html = document.documentElement;
    const inHero = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("#top");
    let x = -100;
    let y = -100;
    let raf = 0;
    const draw = () => {
      raf = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const isInteractive = (t: EventTarget | null) => !!(t as Element | null)?.closest?.("a, button, [data-sound]");

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      const on = inHero(e.target);
      html.classList.toggle("cursor-prompt", on); // custom cursor only over the hero
      el.dataset.visible = on && !isInteractive(e.target) ? "1" : "0";
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onLeave = () => (el.dataset.visible = "0");
    const onClick = (e: MouseEvent) => {
      if (!inHero(e.target) || isInteractive(e.target) || getState().playing) return;
      startSound();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    document.addEventListener("click", onClick);
    return () => {
      html.classList.remove("cursor-prompt");
      el.dataset.visible = "0";
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("click", onClick);
    };
  }, [active]);

  return (
    <div ref={ref} className="cursor-prompt-tag" data-visible="0" aria-hidden>
      <span className="cursor-prompt-square" />
      <span className="cursor-prompt-label">Click to enable sound</span>
    </div>
  );
}
