import Image from "next/image";

/**
 * ABOUT ME — photo on the left, words on the right (stacked on phones).
 * Edit the text in ABOUT below; everything else follows.
 */
const ABOUT = {
  lead: "I’m Sourav — a software engineer who likes turning messy, complex data into things people can actually use.",
  paragraphs: [
    "My work sits where data engineering, AI and intelligent systems meet: building the pipelines that move and shape data, and the applications that make sense of it.",
    "I care about clear systems, honest results and the small details that make software feel good. And I am not perfect — I’m still learning, and I enjoy that part the most.",
  ],
  facts: [
    { label: "Based in", value: "India · IST" },
    { label: "Role", value: "Software Engineer" },
    { label: "Focus", value: "Data Engineering · AI · Intelligent Systems" },
  ],
  links: [{ label: "GitHub", href: "https://github.com/Franky1107" }],
};

export default function AboutSection() {
  return (
    <section id="about" className="border-t border-white/10 px-5 py-20 md:px-[3vw] md:py-[9vw]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] md:gap-[5vw]">
        {/* LEFT — photo */}
        <figure className="about-photo relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#0d0d0d] md:self-center">
          <Image
            src="/about.jpg"
            alt="Portrait of Sourav Mallick"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover object-[50%_20%]"
          />
          <figcaption className="absolute bottom-4 left-4 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
            Sourav Mallick
          </figcaption>
        </figure>

        {/* RIGHT — about me */}
        <div className="flex flex-col md:justify-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent md:text-[12px]">( About me )</p>
          <h2 className="type-heavy mt-4 text-[13vw] uppercase leading-[0.9] md:text-[6vw]">
            Hello,
            <br />
            I’m Sourav.
          </h2>

          <p className="mt-8 max-w-[34ch] text-[1.35rem] leading-snug text-white md:mt-[3vw] md:text-[clamp(1.4rem,2vw,2.1rem)]">{ABOUT.lead}</p>

          <div className="mt-6 flex max-w-[60ch] flex-col gap-4 text-[15px] leading-relaxed text-white/65 md:text-[clamp(15px,1.1vw,17px)]">
            {ABOUT.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <dl className="mt-10 grid grid-cols-1 border-t border-white/15 sm:grid-cols-3 md:mt-[3.5vw]">
            {ABOUT.facts.map((f) => (
              <div key={f.label} className="border-b border-white/15 py-4 sm:pr-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">{f.label}</dt>
                <dd className="mt-2 text-[15px] leading-snug">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {ABOUT.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/25 px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
              >
                {l.label} ↗
              </a>
            ))}
            <a
              href="#contact"
              className="rounded-full bg-white px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.1em] text-black transition-colors hover:bg-accent hover:text-white"
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
