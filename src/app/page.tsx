import Thread from "@/components/thread/Thread";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import NextSections from "@/components/NextSections";

export default function Home() {
  return (
    <main>
      {/* Loading screen — "Hello / Bonjour / Hola…", then the thread starts drawing */}
      <Loader />

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
