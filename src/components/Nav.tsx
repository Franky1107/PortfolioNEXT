// Edit the links here. "#name" scrolls to the section with id="name".
const LINKS = [
  { label: "About", href: "#about" },
  { label: "Project", href: "#projects" },
  { label: "Resume", href: "#resume" },
  { label: "Blog", href: "#blog" },
];

export default function Nav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4">
      {/* Logo */}
      <a href="#top" className="text-[2rem] leading-none md:text-[clamp(2rem,3.3vw,3rem)]" aria-label="Sourav Mallick — home">
        SM
      </a>

      {/* Centre pill — moves to its own full-width row on phones */}
      <nav aria-label="Main" className="order-3 w-full rounded-[1.6rem] bg-pill md:order-none md:w-[54.5%] md:rounded-[2rem]">
        <ul className="flex items-center justify-between px-5 py-3 text-[15px] md:justify-around md:px-[1.5vw] md:py-[1.55vw] md:text-[clamp(1rem,1.9vw,1.75rem)]">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="transition-opacity hover:opacity-70">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Call to action */}
      <a
        href="#contact"
        className="rounded-[1.6rem] bg-pill px-5 py-3 text-[15px] transition-opacity hover:opacity-80 md:rounded-[2rem] md:px-[0.8vw] md:py-[1.55vw] md:text-[clamp(1rem,2.2vw,2rem)] md:leading-none"
      >
        Let’s Connect
      </a>
    </header>
  );
}
