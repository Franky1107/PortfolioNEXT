"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getServerState, getState, initSound, subscribe, toggleSound } from "@/lib/sound";

/** "Sound on / off" button with a tiny equaliser that moves while music plays. */
export default function SoundToggle({ compact = false }: { compact?: boolean }) {
  const { on, playing } = useSyncExternalStore(subscribe, getState, getServerState);

  // only one instance needs to set things up
  useEffect(() => {
    if (compact) return;
    return initSound();
  }, [compact]);

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={toggleSound}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on && !playing ? "Sound will start when you click anywhere" : undefined}
      className={`group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-white/75 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white ${
        compact ? "h-9 w-9 justify-center" : "h-[42px] px-4 text-[13px]"
      }`}
    >
      <span className={`sound-bars ${playing ? "is-playing" : ""}`} aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      {!compact && <span className="whitespace-nowrap">{on ? "Sound on" : "Sound off"}</span>}
    </button>
  );
}
