import { FUNNEL } from "@/lib/thread/config";
import Thread from "./thread/Thread";
import { BarsIcon, CodeIcon, LayersIcon } from "./icons";

const pct = (n: number) => `${n * 100}%`;

// The three items under the funnel. Change the links to your own pages.
const ITEMS = [
  { label: "Projects", href: "#projects", Icon: CodeIcon },
  { label: "Workflows", href: "#workflows", Icon: LayersIcon },
  { label: "Visualizations", href: "#visualizations", Icon: BarsIcon },
];

const LABELS = [
  { id: "raw", title: "RAW DATA", sub: "Large • Messy • Diverse", y: FUNNEL.labelY.raw },
  { id: "pipeline", title: "PIPELINE", sub: "Process • Clean • Transform", y: FUNNEL.labelY.pipeline },
  { id: "insight", title: "INSIGHT", sub: "Actionable • Reliable • Value", y: FUNNEL.labelY.insight },
] as const;

export default function FunnelSection() {
  return (
    /* Laptops: the section is ~1.8 screens tall and its content stays pinned
       on screen (sticky) while the thread draws the funnel.
       Phones: normal height, the thread draws as you scroll past. */
    <section id="approach" className="relative bg-beige text-ink md:h-[180svh]">
      <div className="md:sticky md:top-0 md:h-[100svh]">
        {/* starts at "top 85%" — the same moment the hero thread reaches this
            section's edge (THREAD.followAt), so the two read as one line */}
        <Thread
          route="funnel"
          className="h-full"
          contentClassName="h-full"
          scroll={{ trigger: "#approach", start: "top 85%", end: "bottom 115%", startMobile: "top 85%", endMobile: "bottom 85%" }}
        >
          <div className="grid h-full grid-cols-1 items-center gap-14 px-5 pb-20 pt-24 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-[3vw] md:px-[3vw] md:pb-[4vh] md:pt-[calc(72px+2vh)]">
            {/* LEFT — heading + line */}
            <div className="flex flex-col justify-between self-stretch md:py-[10vh]">
              <h2 className="type-heavy text-[12.5vw] uppercase leading-[0.9] md:text-[5.15vw]">
                <span className="md:block">From complex </span>
                <span className="md:block">ideas to simple </span>
                <span className="md:block">experiences.</span>
              </h2>
              <p className="mt-8 max-w-[34ch] text-[15px] leading-relaxed md:mt-0 md:max-w-none md:text-[1.45vw]">
                I connect data, design and technology to create solutions that make sense.
              </p>
            </div>

            {/* RIGHT — the funnel. The thread draws the funnel itself;
                this box only positions the labels and the three items. */}
            <div data-thread="funnel" className="relative mx-auto aspect-[4/5] w-full max-w-[640px] md:aspect-[5/6] md:w-[min(100%,calc((100svh-72px-8vh)*5/6))]">
              {LABELS.map((l) => (
                <div
                  key={l.id}
                  data-thread-label={l.id}
                  className="absolute right-0 -mt-2 font-mono"
                  style={{ left: pct(FUNNEL.labelX), top: pct(l.y) }}
                >
                  {/* the title's centre sits exactly on the label's y */}
                  <div data-thread={`label-${l.id}`} className="text-[11px] font-bold leading-4 tracking-[0.18em] md:text-[13px]">
                    {l.title}
                  </div>
                  <div className="pt-1 text-[10px] leading-[1.35] text-ink/70 md:text-[10.5px]">{l.sub}</div>
                </div>
              ))}

              {ITEMS.map(({ label, href, Icon }, i) => (
                <a
                  key={label}
                  href={href}
                  data-thread="funnel-item"
                  data-thread-reveal
                  className="absolute flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] hover:!opacity-100 md:text-[12px]"
                  style={{ left: pct(FUNNEL.cx + FUNNEL.itemDx[i]), top: pct(FUNNEL.itemY) }}
                >
                  <Icon />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </Thread>
      </div>
    </section>
  );
}
