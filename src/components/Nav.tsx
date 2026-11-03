"use client";

import { useEffect, useState } from "react";
import SoundToggle from "./SoundToggle";
import MenuIsland from "./MenuIsland";
import { initSound } from "@/lib/sound";

// Edit the links here. "#name" scrolls to the section with id="name".
const LINKS = [
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Resume", href: "#resume" },
  { label: "Blog", href: "#blog" },
];

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Slim, fixed header.
 * - transparent at the top of the page, frosted glass once you scroll
 * - desktop: centred glass pill of links + white "Let's Connect" button
 * - mobile: logo, "Let's Connect" and a menu button that opens the links
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // ambient sound: restore the visitor's choice + hover/click sounds
  useEffect(() => initSound(), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        open
          ? "border-white/10 bg-black/90 backdrop-blur-xl"
          : solid
            ? "border-white/10 bg-black/55 backdrop-blur-xl"
            : "border-transparent bg-transparent"
      }`}
    >
      <div className="relative flex h-16 items-center justify-between px-5 md:h-[72px] md:px-[3vw]">
        {/* Logo */}
        <a href="#top" aria-label="Sourav Mallick — home" className="type-wide text-[1.2rem] leading-none tracking-tight">
          SM
        </a>

        {/* Desktop: the centre menu pill with the play button (becomes the
            "now playing" island when music starts) */}
        <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <MenuIsland links={LINKS} />
        </nav>

        <div className="flex items-center gap-2">
          {/* Call to action */}
          <a
            href="#contact"
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black transition-colors hover:bg-white/85 md:text-[14px]"
          >
            Let’s Connect
            <Arrow className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          {/* Mobile: sound toggle (icon only) */}
          <div className="md:hidden">
            <SoundToggle />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-[1.5px] w-4 bg-white transition-transform duration-200 ${open ? "top-1.5 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 h-[1.5px] w-4 bg-white transition-transform duration-200 ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-white/10 px-5 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={() => setOpen(false)} className="block border-b border-white/5 py-3 text-lg text-white/85">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
