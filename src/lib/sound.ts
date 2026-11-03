"use client";

/**
 * AMBIENT SOUND (opt-in)
 * ----------------------
 * - Off by default. The toggle in the header turns a looping background
 *   track on/off with a smooth fade (Web Audio gain ramps, works on iOS too).
 * - Soft hover/click sounds on links, buttons and anything with
 *   data-sound — only while sound is on.
 * - The visitor's choice is remembered (localStorage). Browsers don't allow
 *   sound to start by itself, so for returning visitors who left it on, it
 *   starts on their first click / tap / key press.
 *
 * To use your own track: put the file in /public/audio/ and change `src`.
 * Set `loopSeconds` to null for a normal track (the whole file loops).
 */
export const SOUND = {
  src: "/audio/ambient.mp3",
  /** exact length of the seamless loop in the placeholder track */
  loopSeconds: 32 as number | null,
  volume: 0.35, // music volume when on (0–1)
  fadeIn: 1.6, // seconds
  fadeOut: 1.0, // seconds
  uiVolume: 0.22, // hover / click sounds
};

const STORAGE_KEY = "sm-sound";

type State = { on: boolean; playing: boolean };
let state: State = { on: false, playing: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getState = () => state;
const SERVER_STATE: State = { on: false, playing: false };
export const getServerState = () => SERVER_STATE;

/* ---------------------------------------------------------------- */
/* Web Audio plumbing                                                 */
/* ---------------------------------------------------------------- */
let ctx: AudioContext | null = null;
let music: GainNode | null = null;
let ui: GainNode | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<AudioBuffer> | null = null;
let source: AudioBufferSourceNode | null = null;
let stopTimer: ReturnType<typeof setTimeout> | undefined;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    music = ctx.createGain();
    music.gain.value = 0;
    music.connect(ctx.destination);
    ui = ctx.createGain();
    ui.gain.value = SOUND.uiVolume;
    ui.connect(ctx.destination);
  }
  return ctx;
}

function load(c: AudioContext) {
  if (buffer) return Promise.resolve(buffer);
  loading ??= fetch(SOUND.src)
    .then((r) => r.arrayBuffer())
    .then((data) => c.decodeAudioData(data))
    .then((b) => (buffer = b));
  return loading;
}

function rampTo(value: number, seconds: number) {
  if (!ctx || !music) return;
  const now = ctx.currentTime;
  music.gain.cancelScheduledValues(now);
  music.gain.setValueAtTime(music.gain.value, now);
  music.gain.linearRampToValueAtTime(value, now + seconds);
}

async function startMusic() {
  const c = audio();
  clearTimeout(stopTimer);
  try {
    await c.resume();
    const b = await load(c);
    if (!state.on) return;
    if (!source) {
      source = c.createBufferSource();
      source.buffer = b;
      source.loop = true;
      if (SOUND.loopSeconds) {
        // skip the MP3 encoder's few ms of silence so the loop is seamless
        const extra = Math.max(0, b.duration - SOUND.loopSeconds);
        source.loopStart = Math.min(extra, 1105 / b.sampleRate);
        source.loopEnd = source.loopStart + SOUND.loopSeconds;
      }
      source.connect(music!);
      source.start(0, source.loopStart);
    }
    rampTo(SOUND.volume, SOUND.fadeIn);
    set({ playing: true });
  } catch {
    set({ playing: false });
  }
}

function stopMusic(keepContext = false) {
  rampTo(0, SOUND.fadeOut);
  set({ playing: false });
  clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    if (state.playing) return;
    if (!keepContext) {
      source?.stop();
      source?.disconnect();
      source = null;
    }
    ctx?.suspend();
  }, SOUND.fadeOut * 1000 + 50);
}

/* ---------------------------------------------------------------- */
/* Public actions                                                     */
/* ---------------------------------------------------------------- */
export function toggleSound() {
  const on = !state.on;
  set({ on });
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {}
  if (on) startMusic();
  else stopMusic();
}

/** A soft UI blip. kind: "hover" (very light) or "click" */
export function blip(kind: "hover" | "click") {
  if (!state.on || !state.playing || !ctx || !ui) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  if (kind === "hover") {
    osc.frequency.setValueAtTime(1320, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  } else {
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  }
  osc.connect(g).connect(ui);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Called once on page load: restores the visitor's last choice and wires up
 * hover/click sounds. Returns a cleanup function.
 */
export function initSound() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {}

  const cleanups: (() => void)[] = [];
  const on = (t: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, opts);
    cleanups.push(() => t.removeEventListener(type, fn, opts));
  };

  if (saved === "on") {
    set({ on: true });
    // browsers only allow audio after the visitor interacts with the page
    const kick = () => {
      if (state.on && !state.playing) startMusic();
      gestures.forEach((g) => window.removeEventListener(g, kick, true));
    };
    const gestures = ["pointerdown", "keydown", "touchstart"];
    gestures.forEach((g) => on(window, g, kick, { capture: true }));
  }

  // hover / click sounds on interactive things (mouse only for hover)
  const SELECTOR = "a, button, [data-sound]";
  let lastHover: Element | null = null;
  on(document, "pointerover", (e) => {
    const ev = e as PointerEvent;
    if (ev.pointerType !== "mouse") return;
    const el = (ev.target as Element | null)?.closest?.(SELECTOR) ?? null;
    if (el && el !== lastHover) blip("hover");
    lastHover = el;
  });
  on(document, "click", (e) => {
    const el = (e.target as Element | null)?.closest?.(SELECTOR);
    if (el && !el.hasAttribute("data-sound-toggle")) blip("click");
  });

  // fade out when the tab is hidden, back in when it returns
  on(document, "visibilitychange", () => {
    if (!state.on) return;
    if (document.hidden) stopMusic(true);
    else startMusic();
  });

  return () => cleanups.forEach((c) => c());
}
