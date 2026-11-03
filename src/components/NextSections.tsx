// Simple placeholder sections so the nav and funnel links have somewhere to go.
// Replace each one with the real section when you build it — and extend the
// thread into it (see src/lib/thread/segments.ts).
const SECTIONS = [
  { id: "projects", title: "Projects" },
  { id: "workflows", title: "Workflows" },
  { id: "visualizations", title: "Visualizations" },
  { id: "about", title: "About" },
];

export default function NextSections() {
  return (
    <>
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="flex min-h-[60svh] flex-col justify-center border-t border-white/10 px-5 py-20 md:px-[3vw]">
          <h2 className="type-heavy text-[11vw] uppercase leading-none md:text-[5vw]">{s.title}</h2>
          <p className="mt-4 font-mono text-sm text-white/60">Coming soon.</p>
        </section>
      ))}

      <footer id="contact" className="border-t border-white/10 px-5 py-16 md:px-[3vw]">
        <h2 className="type-heavy text-[9vw] uppercase leading-none md:text-[4vw]">Let’s connect</h2>
        {/* TODO: add your email and LinkedIn links */}
        <ul className="mt-6 flex gap-6 font-mono text-sm">
          <li>
            <a href="https://github.com/Franky1107" className="underline underline-offset-4 hover:opacity-70">
              GitHub
            </a>
          </li>
        </ul>
        <p className="mt-10 text-xs text-white/40">© Sourav Mallick</p>
      </footer>
    </>
  );
}
