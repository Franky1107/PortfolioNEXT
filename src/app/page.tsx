import Thread from "@/components/thread/Thread";
import Nav from "@/components/Nav";
import Loader from "@/components/Loader";
import NavSplash from "@/components/NavSplash";
import Hero from "@/components/Hero";
import FunnelSection from "@/components/FunnelSection";
import NextSections from "@/components/NextSections";

export default function Home() {
  return (
    <main>
      {/* Loading screen — slides away, then the thread starts drawing */}
      <Loader />

      {/* "Hello / Bonjour / Hola…" splash when a menu link is clicked */}
      <NavSplash />

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
