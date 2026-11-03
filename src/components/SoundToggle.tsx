"use client";

import { useSyncExternalStore } from "react";
import { getServerState, getState, subscribe, toggleSound } from "@/lib/sound";

/** Phones: a small pink play button (shows moving bars while music plays). */
export default function SoundToggle() {
  const { on, playing } = useSyncExternalStore(subscribe, getState, getServerState);
  return (
    <button
      type="button"
      data-sound-toggle
      onClick={toggleSound}
      aria-pressed={on}
      aria-label={on ? "Pause music" : "Play music"}
      className="sound-orb"
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
  );
}
