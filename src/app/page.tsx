import Thread from "@/components/thread/Thread";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import CursorPrompt from "@/components/CursorPrompt";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import NextSections from "@/components/NextSections";

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
      <NextSections />
    </main>
  );
}
