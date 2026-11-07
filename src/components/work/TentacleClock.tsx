"use client";

import { useEffect, useRef, useState } from "react";

/**
 * TENTACLE CLOCK
 * --------------
 * Local time (Asia/Kolkata) in big digits. Around it, one small label per
 * second that has passed this minute (00, 01, 02 …) sits on a gently widening
 * spiral that starts at the bottom right, curves up over the top and down the
 * left. From the time, a thin "tentacle" grows out to each label and sways
 * like seaweed. When the minute changes, everything resets to 00.
 * Drawn on a <canvas> with requestAnimationFrame.
 */
const TZ = "Asia/Kolkata";
const C = {
  digits: "#1a0f0a",
  label: "rgba(26, 15, 10, 0.45)",
  line: "rgba(26, 15, 10, 0.22)",
};
const START_DEG = -24; // where "00" sits (just below the right-hand horizontal)
const STEP_DEG = 6; // degrees per second → 60 s = one full turn
const GROW_MS = 700; // how long a new tentacle takes to grow

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
function kolkataTime(d = new Date()) {
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return { hm: `${parts.hour}:${parts.minute}`, s: Number(parts.second) };
}

/** seeded per-second randomness so each tentacle sways a little differently */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function TentacleClock({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hm, setHm] = useState("--:--");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // when each second's tentacle was born (performance.now()), for the current minute
    let minuteKey = "";
    let born: number[] = [];
    let lastSecond = -1;

    const sync = (now: number) => {
      const t = kolkataTime();
      if (t.hm !== minuteKey) {
        // new minute → reset; on first load show the seconds already passed, fully grown
        const first = minuteKey === "";
        minuteKey = t.hm;
        setHm(t.hm);
        born = [];
        for (let s = 0; s <= t.s; s++) born[s] = first ? now - GROW_MS : s === t.s ? now : now - GROW_MS;
        lastSecond = t.s;
        return;
      }
      if (t.s !== lastSecond) {
        for (let s = lastSecond + 1; s <= t.s; s++) born[s] = now;
        lastSecond = t.s;
      }
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const size = Math.min(W, H * 1.35);
      const cx = W / 2;
      const cy = H * 0.52;
      const R = size * 0.36; // spiral radius at "00"
      const digitPx = size * 0.14;
      const origin = { x: cx, y: cy - digitPx * 0.42 }; // tentacles leave from just above the digits
      const labelPx = Math.max(9, size * 0.03);
      const time = now / 1000;

      ctx.font = `500 ${labelPx}px "JetBrains Mono Variable", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineCap = "round";

      for (let s = 0; s < born.length; s++) {
        const b = born[s];
        if (b === undefined) continue;
        const g = reduce ? 1 : Math.min(1, Math.max(0, (now - b) / GROW_MS));
        const grow = 1 - Math.pow(1 - g, 3); // ease-out

        // label position on the widening spiral
        const a = ((START_DEG + STEP_DEG * s) * Math.PI) / 180;
        const r = R * (1 + 0.1 * (s / 59));
        const lx = cx + r * Math.cos(a);
        const ly = cy - r * Math.sin(a) * 0.92;

        // tentacle end: stop just short of the label
        const dx = lx - origin.x;
        const dy = ly - origin.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ex = origin.x + dx * (1 - (labelPx * 1.2) / dist);
        const ey = origin.y + dy * (1 - (labelPx * 1.2) / dist);
        const nx = -dy / dist; // unit normal
        const ny = dx / dist;

        // gentle seaweed sway: two slow sines, different for every tentacle
        const sw = reduce ? 0 : 1;
        const amp = dist * 0.16;
        const bias = dist * 0.1 * (rand(s, 1) > 0.5 ? 1 : -1);
        const s1 = bias + sw * amp * Math.sin(time * (0.45 + rand(s, 2) * 0.35) + rand(s, 3) * 6.28);
        const s2 = bias * 0.6 + sw * amp * 0.8 * Math.sin(time * (0.35 + rand(s, 4) * 0.3) + rand(s, 5) * 6.28);
        const c1x = origin.x + dx * 0.33 + nx * s1;
        const c1y = origin.y + dy * 0.33 + ny * s1;
        const c2x = origin.x + dx * 0.68 + nx * s2;
        const c2y = origin.y + dy * 0.68 + ny * s2;

        // draw the curve from the origin up to `grow`
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        const steps = 28;
        for (let k = 1; k <= steps; k++) {
          const t = (k / steps) * grow;
          const u = 1 - t;
          const x = u * u * u * origin.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex;
          const y = u * u * u * origin.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey;
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // the label fades in as its tentacle arrives
        ctx.globalAlpha = Math.max(0, (grow - 0.55) / 0.45);
        ctx.fillStyle = C.label;
        ctx.fillText(String(s).padStart(2, "0"), lx, ly);
        ctx.globalAlpha = 1;
      }
    };

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      sync(now);
      draw(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);

    // pause when the clock is off screen or the tab is hidden
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(wrap);
    const onVis = () => {
      visible = !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
      {/* the time itself is real text: crisp and readable by screen readers */}
      <div className="absolute inset-x-0 top-[52%] -translate-y-1/2 text-center">
        <time className="clock-digits" aria-label={`Local time in Kolkata ${hm}`}>
          {hm.split("").map((c, i) => (
            <span key={i} className={c === ":" ? "clock-colon" : undefined}>
              {c}
            </span>
          ))}
        </time>
      </div>
    </div>
  );
}
