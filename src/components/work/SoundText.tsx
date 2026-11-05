"use client";

import { useSyncExternalStore } from "react";
import { SOUND, getServerState, getState, subscribe, toggleSound } from "@/lib/sound";

/** "SOUND: ON / OFF" text switch for the clock panel (same sound as the header). */
export default function SoundText() {
  const { on, playing } = useSyncExternalStore(subscribe, getState, getServerState);
  if (!SOUND.enabled) return null;
  return (
    <button type="button" data-sound-toggle onClick={toggleSound} aria-pressed={on} className="group inline-flex items-center gap-2 uppercase">
      Sound:
      <span className="inline-flex w-8 items-center justify-start">
        {playing ? (
          <span className="sound-bars is-playing" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <span className="h-px w-5 bg-current transition-all group-hover:w-7" aria-hidden />
        )}
      </span>
      <span className="sr-only">{on ? "on" : "off"}</span>
    </button>
  );
}
