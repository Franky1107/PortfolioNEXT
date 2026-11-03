import Thread from "@/components/thread/Thread";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import NextSections from "@/components/NextSections";

export default function Home() {
  return (
    <main>
      {/* Fixed header — outside <Thread> so it always sits above the thread */}
      <Nav />

      {/* Everything inside <Thread> can be reached by the thread */}
      <Thread>
        <Hero />
        <FunnelSection />
        <NextSections />
      </Thread>
    </main>
  );
}
