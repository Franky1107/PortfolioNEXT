import PortraitThreads from "./PortraitThreads";
import StretchName from "./StretchName";

const TAGLINE = "and I am not perfect";

export default function Hero() {
  return (
    <section id="top" data-thread="hero" className="relative flex min-h-[100svh] flex-col px-5 pb-10 pt-24 md:px-[3vw] md:pb-0 md:pt-[96px]">
      <div className="grid flex-1 grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_30.3vw] md:gap-[2vw]">
        {/* LEFT — name + tagline */}
        <div className="flex flex-col justify-center md:py-[3svh]">
          <p data-thread="iam" className="self-start pl-[0.15em] text-[1.35rem] font-medium tracking-[0.32em] md:text-[length:min(2.6vw,4.4svh)]">
            I AM
          </p>

          {/* each line is stretched sideways to fill the column, right up to the photo */}
          <StretchName
            className="type-wide mt-1 text-[19.5vw] leading-[0.92] md:text-[length:min(13.2vw,21svh)]"
            lines={[
              { word: "Sourav", anchor: "name-1" },
              { word: "Mallick", anchor: "name-2" },
            ]}
          />

          {/* glowing line — each letter lights up in turn after the loading screen */}
          <p
            data-thread="tagline"
            aria-label={TAGLINE}
            className="glow-line mt-20 self-start text-[1.7rem] md:mt-[min(6vw,9svh)] md:text-[length:min(2.6vw,4.6svh)]"
          >
            {TAGLINE.split("").map((ch, i) =>
              ch === " " ? (
                " "
              ) : (
                <span key={i} aria-hidden className="glow-letter" style={{ "--i": i } as React.CSSProperties}>
                  {ch}
                </span>
              ),
            )}
          </p>
        </div>

        {/* RIGHT — tangled threads that untangle into a person's outline on hover / tap */}
        <div data-thread="photo" className="relative ml-auto aspect-[413/520] w-[72%] self-start md:w-full">
          <PortraitThreads className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
