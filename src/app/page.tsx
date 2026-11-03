import Thread from "@/components/thread/Thread";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import NextSections from "@/components/NextSections";

export default function Home() {
  return (
    <main>
      {/* Everything inside <Thread> can be reached by the thread */}
      <Thread>
        <Hero />
        <FunnelSection />
        <NextSections />
      </Thread>
    </main>
  );
}
