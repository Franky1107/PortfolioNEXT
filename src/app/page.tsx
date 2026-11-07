import Thread from "@/components/thread/Thread";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import CursorPrompt from "@/components/CursorPrompt";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import ContactSection from "@/components/ContactSection";
import WorkSection from "@/components/work/WorkSection";
import AboutSection from "@/components/AboutSection";
import PhotoAccordionMarquee from "@/components/PhotoAccordionMarquee";
import GalleryThread from "@/components/GalleryThread";

// gallery strip after About me — swap these for your own photos in /public/gallery
const GALLERY = Array.from({ length: 8 }, (_, i) => ({
  src: `/gallery/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Placeholder photo ${i + 1}`,
  caption: `Placeholder ${String(i + 1).padStart(2, "0")}`,
}));

export default function Home() {
  return (
    <main>
      {/* Loading screen — "Hello / Bonjour / Hola…", then the thread starts drawing */}
      <Loader />

      {/* "Click to enable sound" cursor, until music is playing */}
      <CursorPrompt />

      {/* Fixed header — outside <Thread> so it always sits above the thread */}
      <Nav />

      {/* The hero thread; the funnel section has its own thread that picks up
          exactly where this one ends (see FunnelSection) */}
      <Thread route="hero">
        <Hero />
      </Thread>
      <FunnelSection />
      {/* sticky split screen: tentacle clock + project cards, helix thread between */}
      <WorkSection />
      <AboutSection />
      <section id="gallery" className="relative border-t border-white/10 py-20 md:py-[7vw]">
        {/* the thread from About me: drops to a dot, frames the photo you hover */}
        <GalleryThread />
        <p className="px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent md:px-[3vw] md:text-[12px]">( Gallery )</p>
        <div data-gallery-strip className="mt-8 md:mt-[6vw]">
          <PhotoAccordionMarquee images={GALLERY} />
        </div>
      </section>
      <ContactSection />
    </main>
  );
}
