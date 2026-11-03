import Image from "next/image";

/** Splits a word into one <span> per letter so the thread can weave through them. */
function Letters({ word, anchor }: { word: string; anchor: string }) {
  return (
    <span className="block whitespace-nowrap" aria-hidden>
      {word.split("").map((ch, i) => (
        <span key={i} data-thread={anchor} className="inline-block">
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  return (
    <section id="top" data-thread="hero" className="relative flex min-h-[100svh] flex-col px-5 pb-10 pt-24 md:px-[3vw] md:pb-0 md:pt-[96px]">
      <div className="grid flex-1 grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_30.3vw] md:gap-[3vw]">
        {/* LEFT — name + tagline */}
        <div className="flex flex-col justify-center md:pb-[5vw] md:pt-[8vw]">
          <p data-thread="iam" className="self-start pl-[0.15em] text-[1.35rem] font-medium tracking-[0.32em] md:text-[2.6vw]">
            I AM
          </p>

          <h1 aria-label="Sourav Mallick" className="type-wide mt-1 text-[19.5vw] leading-[0.92] md:text-[13.2vw]">
            <Letters word="Sourav" anchor="name-1" />
            <Letters word="Mallick" anchor="name-2" />
          </h1>

          <p data-thread="tagline" className="mt-10 max-w-[44ch] self-start text-[15px] leading-relaxed md:mt-[3.6vw] md:max-w-none md:text-[1.4vw] md:leading-[1.4]">
            Software Engineer working across data engineering,
            <br className="hidden md:block" /> AI and intelligent systems, transforming complex data into meaningful solutions.
          </p>
        </div>

        {/* RIGHT — portrait (replace /public/profile.jpg with your photo) */}
        <div data-thread="photo" className="relative ml-auto aspect-[413/520] w-[72%] self-start md:w-full">
          <Image
            src="/profile.jpg"
            alt="Portrait of Sourav Mallick"
            fill
            priority
            sizes="(min-width: 768px) 31vw, 72vw"
            className="object-cover grayscale"
          />
        </div>
      </div>
    </section>
  );
}
