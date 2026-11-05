"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getServerState, getState, subscribe, toggleSound } from "@/lib/sound";

type Link = { label: string; href: string };

const ISLAND_MS = 2800; // how long the "now playing" island stays before turning back into the menu

/**
 * The centre menu pill, with a play button at its left end.
 * Pressing play morphs the same pill — same size — into a light "now
 * playing" island (stop button + live waveform), like the iPhone's Dynamic
 * Island, then it settles back into the menu (the play button then shows
 * moving bars; press it again to stop).
 */
export default function MenuIsland({ links }: { links: Link[] }) {
  const { on, playing } = useSyncExternalStore(subscribe, getState, getServerState);
  const [islandWanted, setIsland] = useState(false);
  const island = islandWanted && playing; // never show the island when music is off
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wasPlaying = useRef(false);

  const showIsland = (ms = ISLAND_MS) => {
    clearTimeout(timer.current);
    setIsland(true);
    timer.current = setTimeout(() => setIsland(false), ms);
  };

  // music just started → show the island
  useEffect(() => {
    const unsub = subscribe(() => {
      const now = getState().playing;
      if (now && !wasPlaying.current) showIsland();
      wasPlaying.current = now;
    });
    return () => {
      unsub();
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      className={`menu-island ${island ? "is-island" : ""}`}
    >
      {/* MENU (default) */}
      <div className="menu-island__menu" aria-hidden={island}>
        <button
          type="button"
          data-sound-toggle
          onClick={toggleSound}
          aria-pressed={on}
          aria-label={on ? "Pause music" : "Play music"}
          className="sound-orb"
          tabIndex={island ? -1 : 0}
        >
          {playing ? (
            <span className="sound-bars is-playing is-light" aria-hidden>
              <i />
              <i />
              <i />
              <i />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
              <path d="M7 4.5v15l12.5-7.5z" fill="white" />
            </svg>
          )}
        </button>
        <ul className="flex items-center gap-1">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                tabIndex={island ? -1 : 0}
                className="block rounded-full px-4 py-1.5 text-[14px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* NOW PLAYING island */}
      <div className="menu-island__now" aria-hidden={!island}>
        <button
          type="button"
          data-sound-toggle
          onClick={toggleSound}
          aria-label="Stop music"
          className="stop-square"
          tabIndex={island ? 0 : -1}
        />
        <span className="waveform" aria-hidden>
          {Array.from({ length: 15 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i * 0.11) % 0.9}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}
