import { PROJECTS, type Project } from "@/lib/projects";
import HelixThread from "./HelixThread";
import ScrollCards from "./ScrollCards";
import SoundText from "./SoundText";
import TentacleClock from "./TentacleClock";

/**
 * WORK — sticky split screen.
 * Desktop: the left panel (clock, name, intro, links) stays fixed while the
 * project cards on the right scroll past; a helix thread coils down the gap.
 * Phones: one column that scrolls normally.
 */
export default function WorkSection() {
  return (
    <section id="projects" data-helix-root className="work relative bg-beige px-3 pb-3 pt-3 md:px-[1.4vw] md:pb-[1.4vw] md:pt-[calc(72px+1.4vw)]">
      <HelixThread root="#projects" />

      <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.43fr)_minmax(0,0.57fr)] md:gap-[1.2vw]">
        {/* LEFT — stays in place on desktop */}
        <aside
          data-helix-left
          className="flex flex-col rounded-[18px] bg-[#fdf8f4] p-6 text-[#1a0f0a] md:sticky md:top-[calc(72px+1.4vw)] md:h-[calc(100svh-72px-2.8vw)] md:p-[2vw]"
        >
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.12em] md:text-[12px]">India · IST</p>

          <TentacleClock className="my-4 aspect-square w-full flex-1 md:my-0 md:aspect-auto md:min-h-0" />

          <div className="mt-2 flex flex-col gap-5 md:mt-0">
            <div>
              <p className="type-wide text-[clamp(1.1rem,1.6vw,1.5rem)] leading-none">Sourav Mallick</p>
              <p className="mt-2 max-w-[42ch] text-[13px] leading-snug text-[#1a0f0a]/70 md:text-[14px]">
                Software engineer turning complex data into simple, useful experiences.
              </p>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] md:text-[12px]">
              <nav aria-label="Work section" className="flex gap-5">
                <a href="#projects" className="hover:opacity-60">
                  Work
                </a>
                <a href="#about" className="hover:opacity-60">
                  About
                </a>
                <a href="#contact" className="hover:opacity-60">
                  Contact ↗
                </a>
              </nav>
              <SoundText />
            </div>
          </div>
        </aside>

        {/* RIGHT — the project cards scroll past */}
        <ScrollCards
          // the extra bottom padding (245svh) is the extra scroll length: the cards drift down into it so they pass slower
          className="rounded-[18px] bg-[#0d0d0d] p-3 md:p-[1.4vw] md:pb-[calc(1.4vw+245svh)] motion-reduce:md:pb-[1.4vw]"
          innerClassName="flex flex-col gap-3 md:gap-[1.4vw]"
          helix
        >
          <div className="flex items-baseline justify-between px-2 pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50 md:px-[0.6vw] md:pt-[0.6vw] md:text-[12px]">
            <span>Selected work</span>
            <span>{String(PROJECTS.length).padStart(2, "0")} projects</span>
          </div>
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.name} project={p} index={i} />
          ))}
        </ScrollCards>
      </div>
    </section>
  );
}

function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const Tag = p.href ? "a" : "article";
  return (
    <Tag {...(p.href ? { href: p.href } : {})} data-sound className="project-card group block rounded-[14px] bg-[#161616] p-3 text-white md:p-[1vw]">
      <div className="project-media relative aspect-[16/10] overflow-hidden rounded-[10px]">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="project-art h-full w-full" style={{ "--h": p.hue } as React.CSSProperties}>
            <span className="type-wide absolute bottom-[6%] left-[5%] text-[clamp(3rem,7vw,7rem)] leading-none text-white/90">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="absolute right-[4%] top-[5%] font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">Placeholder image</span>
          </div>
        )}
      </div>
      <div className="project-text">
      <div className="flex flex-col gap-1 px-1 pb-1 pt-4 md:flex-row md:items-baseline md:justify-between md:gap-6">
        <h3 className="type-heavy text-[clamp(1.4rem,2.2vw,2rem)] leading-none">{p.name}</h3>
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-white/55 md:text-[12px]">
          {p.type} · {p.year}
        </p>
      </div>
      <p className="px-1 pb-1 pt-2 text-[14px] leading-snug text-white/65">{p.description}</p>
      </div>
    </Tag>
  );
}
