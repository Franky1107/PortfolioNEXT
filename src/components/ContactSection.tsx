"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { THREAD } from "@/lib/thread/config";
import { moveTo, smoothCommands } from "@/lib/thread/geometry";
import type { Pt } from "@/lib/thread/types";

/**
 * LET'S CONNECT — the last section.
 * Left: big headline, "Let's talk", back to top.
 * Right: the thread (arriving from the Gallery at the top centre) ties itself
 * into a knot and hangs a ring that sways gently. Pull the ring far enough —
 * or press "Let's talk" — and the thread straightens and the contact form
 * opens. Close the form and the thread springs back into its knot.
 */
const CONTACT = {
  lines: ["Got something", "in your mind?", "Let’s", "connect."],
  // the form opens the visitor's mail app addressed to this
  email: "souravmallick900@gmail.com",
};

// the knot, designed in a 600 × 720 box and fitted into the right-hand column
const BOX_W = 600;
const BOX_H = 720;
const KNOT: Pt[] = (() => {
  const pts: Pt[] = [{ x: 330, y: 60 }];
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2 * 2.6;
    pts.push({
      x: 320 + 210 * (0.62 * Math.cos(a + 0.6) + 0.38 * Math.cos(2.3 * a)),
      y: 300 + 190 * (0.6 * Math.sin(1.3 * a) + 0.4 * Math.sin(3.1 * a + 0.4)),
    });
  }
  pts.push({ x: 380, y: 560 });
  return pts;
})();
const REST_IN_BOX: Pt = { x: 360, y: 640 };
const PULL_OPEN = 1; // fully untangled → open the form
const PULL_PX = 260;

// footer icons — add LinkedIn, X, etc. here
const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/Franky1107",
    icon: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sourav-mallick1107",
    evenodd: true,
    icon: "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3.5 3.9a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM6.3 9.5v8.3h2.4V9.5H6.3Zm4.5 0v8.3h2.4v-4.2c0-1.2.8-2 1.9-2 1 0 1.3.8 1.3 1.9v4.3h2.4v-4.8c0-2.2-.8-3.7-3-3.7-1.1 0-2.2.5-2.7 1.4V9.5h-2.3Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/mso_urav07",
    evenodd: true,
    icon: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z",
  },
  {
    label: "Email",
    href: "mailto:souravmallick900@gmail.com",
    icon: "M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13Zm2 .9v.3l8 5.3 8-5.3v-.3H4Zm16 2.7-7.45 4.94a1 1 0 0 1-1.1 0L4 9.1V18h16V9.1Z",
  },
]; // how far you pull for "fully untangled"

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const api = useRef<{ open: () => void; close: () => void } | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const box = boxRef.current;
    const path = pathRef.current;
    const ring = ringRef.current;
    const hint = hintRef.current;
    const dialog = dialogRef.current;
    if (!section || !box || !path || !ring || !hint || !dialog) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* layout (section pixels) ---------------------------------------- */
    let anchor: Pt = { x: 0, y: 0 };
    let knot: Pt[] = [];
    let rest: Pt = { x: 0, y: 0 };
    const layout = () => {
      const s = section.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const k = Math.min(b.width / BOX_W, b.height / BOX_H);
      const ox = b.left - s.left + (b.width - BOX_W * k) / 2;
      const oy = b.top - s.top;
      const map = (p: Pt) => ({ x: ox + p.x * k, y: oy + p.y * k });
      knot = KNOT.map(map);
      rest = map(REST_IN_BOX);
      // desktop: the thread comes from the Gallery, top centre; phones: from above the knot
      anchor = window.innerWidth >= THREAD.mobileBreakpoint ? { x: s.width / 2, y: 0 } : { x: knot[0].x, y: oy };
      hint.style.left = `${rest.x}px`;
      hint.style.top = `${rest.y + 34}px`;
    };

    /* state ------------------------------------------------------------ */
    const pull = { x: 0, y: 0 }; // ring offset from rest (pulled / tweened)
    const sway = { x: 0, y: 0 }; // idle sway
    let drawn = reduce ? 1 : 0; // how much of the thread is drawn (scroll)
    let open = false;
    let dragging = false;

    const render = () => {
      const pos = { x: rest.x + pull.x + sway.x, y: rest.y + pull.y + sway.y };
      // the further the ring is pulled from rest, the straighter the thread
      const t = Math.min(1, Math.hypot(pull.x, pull.y) / PULL_PX);
      const e = t * t * (3 - 2 * t);
      const raw = [anchor, ...knot, rest];
      const n = raw.length - 1;
      const pts = raw.map((p, i) => {
        const f = i / n;
        const sx = anchor.x + (pos.x - anchor.x) * f; // straight line anchor → ring
        const sy = anchor.y + (pos.y - anchor.y) * f;
        const kx = p.x + (pos.x - rest.x) * f * f; // the knot, carried along by the pull (tail moves most)
        const ky = p.y + (pos.y - rest.y) * f * f;
        return { x: kx + (sx - kx) * e, y: ky + (sy - ky) * e };
      });
      path.setAttribute("d", moveTo(pts[0]) + smoothCommands(pts).join(""));
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len + 20}`;
      path.style.strokeDashoffset = String(len * (1 - drawn));
      ring.setAttribute("transform", `translate(${pos.x} ${pos.y})`);
      ring.style.opacity = drawn > 0.99 ? "1" : "0";
      hint.style.opacity = drawn > 0.99 && !dragging && !open && t < 0.1 ? "1" : "0";
    };
    layout();
    render();

    /* 1. drawn in as the section scrolls up (continuing from the Gallery) */
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "top 15%",
      scrub: reduce ? false : true,
      onRefresh: (self) => {
        layout();
        if (!reduce) drawn = self.progress;
        render();
      },
      onUpdate: (self) => {
        if (!reduce) drawn = self.progress;
        render();
      },
    });

    /* 2. the tail sways while it's on screen and left alone */
    const swayTick = (time: number) => {
      if (!dragging && !open) {
        sway.x = Math.sin(time * 1.3) * 12 + Math.sin(time * 2.9) * 4;
        sway.y = Math.sin(time * 0.9 + 1) * 7;
      }
      render();
    };
    let ticking = false;
    const io = new IntersectionObserver(([e]) => {
      const on = e.isIntersecting && !reduce;
      if (on && !ticking) gsap.ticker.add(swayTick);
      if (!on && ticking) gsap.ticker.remove(swayTick);
      ticking = on;
    });
    io.observe(section);

    /* 3. pull → untangle → open the form; close → re-tangle ------------ */
    const openForm = () => {
      if (open) return;
      open = true;
      // finish the pull in the direction it was going (or to the left), fully straight
      const d = Math.hypot(pull.x, pull.y) || 1;
      const dir = d > 20 ? { x: pull.x / d, y: pull.y / d } : { x: -1, y: 0 };
      gsap.to(pull, { x: dir.x * PULL_PX * 1.15, y: dir.y * PULL_PX * 1.15, duration: reduce ? 0 : 0.5, ease: "power3.out", onUpdate: render });
      gsap.to(sway, { x: 0, y: 0, duration: 0.4, onUpdate: render });
      setSent(false);
      dialog.showModal();
    };
    const retangle = () => {
      open = false;
      gsap.to(pull, { x: 0, y: 0, duration: reduce ? 0 : 1.6, ease: "elastic.out(1, 0.4)", onUpdate: render });
    };
    api.current = { open: openForm, close: () => dialog.close() };
    dialog.addEventListener("close", retangle);

    const toLocal = (e: PointerEvent) => {
      const s = section.getBoundingClientRect();
      return { x: e.clientX - s.left, y: e.clientY - s.top };
    };
    let grab = { x: 0, y: 0 };
    let pressAt = 0;
    const down = (e: PointerEvent) => {
      if (open) return;
      dragging = true;
      ring.setPointerCapture(e.pointerId);
      gsap.killTweensOf(pull);
      const p = toLocal(e);
      grab = { x: p.x - pull.x, y: p.y - pull.y };
      pressAt = Math.hypot(pull.x, pull.y);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const p = toLocal(e);
      pull.x = p.x - grab.x;
      pull.y = p.y - grab.y;
      render();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const d = Math.hypot(pull.x, pull.y);
      // a plain click/tap on the ring (barely moved) also untangles and opens
      if (d / PULL_PX >= PULL_OPEN * 0.85 || Math.abs(d - pressAt) < 6) openForm();
      else gsap.to(pull, { x: 0, y: 0, duration: 1.4, ease: "elastic.out(1, 0.45)", onUpdate: render });
    };
    ring.addEventListener("pointerdown", down);
    ring.addEventListener("pointermove", move);
    ring.addEventListener("pointerup", up);
    ring.addEventListener("pointercancel", up);
    const ro = new ResizeObserver(() => {
      layout();
      render();
    });
    ro.observe(section);

    return () => {
      st.kill();
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(swayTick);
      gsap.killTweensOf([pull, sway]);
      dialog.removeEventListener("close", retangle);
      ring.removeEventListener("pointerdown", down);
      ring.removeEventListener("pointermove", move);
      ring.removeEventListener("pointerup", up);
      ring.removeEventListener("pointercancel", up);
      api.current = null;
    };
  }, []);

  // shortcut: no backend — "Send" opens the visitor's mail app with the message; swap for a form service/API route later
  const send = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = `Hello from ${f.get("name")}`;
    const body = `${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <footer
      ref={sectionRef}
      id="contact"
      className="relative grid min-h-[100svh] grid-cols-1 overflow-hidden border-t border-white/10 px-5 pb-10 pt-24 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:px-[3vw] md:pb-[3vw] md:pt-[calc(72px+3vw)]"
    >
      {/* the thread + its ring (drag the ring) */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
        <path ref={pathRef} fill="none" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <g ref={ringRef} className="pointer-events-auto cursor-grab touch-none active:cursor-grabbing" style={{ opacity: 0 }}>
          <circle r={34} fill="transparent" />
          <circle r={13} fill="var(--ink)" stroke="var(--accent)" strokeWidth={THREAD.strokeWidth} />
        </g>
      </svg>
      {/* clicking the label does the pull for you */}
      <button
        ref={hintRef}
        type="button"
        onClick={() => api.current?.open()}
        className="absolute z-30 -translate-x-1/2 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80 transition-[opacity,color] duration-300 hover:text-accent md:text-[12px]"
        style={{ opacity: 0 }}
      >
        Pull to untangle
      </button>

      {/* LEFT — headline, let's talk, back to top */}
      <div className="relative z-20 flex flex-col">
        <h2 className="type-heavy text-[14vw] uppercase leading-[0.9] md:text-[length:min(7.4vw,14svh)]">
          {CONTACT.lines.map((l, i) => (
            <span key={l} className="block" style={{ paddingLeft: `${[0, 0.6, 0.15, 0.4][i % 4]}em` }}>
              {l}
            </span>
          ))}
        </h2>

        <button
          type="button"
          onClick={() => api.current?.open()}
          data-sound
          className="type-heavy group mt-12 inline-flex items-center gap-3 self-start border-b-2 border-white pb-2 text-[clamp(1.6rem,2.6vw,2.6rem)] uppercase leading-none transition-colors hover:border-accent hover:text-accent md:mt-[6svh]"
        >
          Let’s talk.
          <svg viewBox="0 0 24 24" className="h-[0.9em] w-[0.9em] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M6 18 18 6M8 6h10v10" />
          </svg>
        </button>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-5 pt-16 font-mono text-[11px] uppercase tracking-[0.12em] text-white/80 md:text-[12px]">
          <a href="#top" className="inline-flex items-center gap-3 whitespace-nowrap hover:text-accent">
            Back to top <span aria-hidden>↑</span>
          </a>
          <ul className="flex items-center gap-4 md:gap-5" aria-label="Socials">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="block text-white/80 transition-colors hover:text-accent">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d={s.icon} fillRule={"evenodd" in s ? "evenodd" : undefined} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
          <p className="whitespace-nowrap text-white/40">© Sourav Mallick</p>
        </div>
      </div>

      {/* RIGHT — the box the knot is fitted into */}
      <div ref={boxRef} aria-hidden className="relative order-first -mx-5 -mt-24 h-[62svh] md:order-none md:mx-0 md:-mt-[calc(72px+3vw)] md:h-auto" />

      {/* THE CONTACT FORM (native <dialog>: focus trap, Esc to close, backdrop) */}
      <dialog
        ref={dialogRef}
        aria-labelledby="contact-title"
        className="contact-dialog m-auto w-[min(1430px,calc(100vw-24px))] max-w-none border border-white/15 bg-[#060606] p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
      >
        <div className="grid grid-cols-1 gap-10 p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[4vw] md:p-[4vw]">
          <div>
            <h2 id="contact-title" className="type-heavy text-[17vw] uppercase leading-[0.86] md:text-[length:min(8vw,15svh)]">
              Let’s
              <br />
              <span className="text-accent">talk.</span>
            </h2>
            <p className="mt-6 max-w-[22ch] text-[1.2rem] leading-snug md:mt-[4svh] md:text-[length:clamp(1.1rem,1.5vw,1.6rem)]">
              A question, an idea, or a tangle to sort out.
            </p>
          </div>

          <form onSubmit={send} className="relative flex flex-col gap-8 md:pt-[3svh]">
            <button
              type="button"
              onClick={() => api.current?.close()}
              aria-label="Close"
              className="absolute -right-1 -top-3 p-2 text-white transition-colors hover:text-accent md:-top-[1svh]"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M5 5l14 14M19 5 5 19" />
              </svg>
            </button>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-[3vw]">
              <Field label="Your name" name="name" placeholder="Your name" autoComplete="name" autoFocus />
              <Field label="Your email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
            </div>
            <label className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] md:text-[12px]">What’s on your mind?</span>
              <textarea
                name="message"
                required
                rows={6}
                placeholder="A problem, an idea, or something you’re figuring out."
                className="resize-none border-b border-white/25 bg-transparent pb-3 text-[1.15rem] outline-none placeholder:text-white/40 focus:border-accent md:text-[length:clamp(1.05rem,1.3vw,1.4rem)]"
              />
            </label>
            <div className="flex items-center justify-end gap-6">
              {sent && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">Opening your mail app…</p>}
              <button
                type="submit"
                className="type-heavy group inline-flex items-center gap-3 border-b-2 border-white pb-2 text-[clamp(1.4rem,2.3vw,2.3rem)] uppercase leading-none transition-colors hover:border-accent hover:text-accent"
              >
                Send message
                <svg viewBox="0 0 24 24" className="h-[0.9em] w-[0.9em] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M6 18 18 6M8 6h10v10" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </footer>
  );
}

function Field({ label, ...input }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] md:text-[12px]">{label}</span>
      <input
        required
        {...input}
        className="border-b border-white/25 bg-transparent pb-3 text-[1.15rem] outline-none placeholder:text-white/40 focus:border-accent md:text-[length:clamp(1.05rem,1.3vw,1.4rem)]"
      />
    </label>
  );
}
