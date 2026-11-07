import Link from "next/link";

/** Shared frame for /blog pages: a quiet, narrow reading column. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-[720px] flex-col px-5 md:px-6">
      <header className="flex items-center justify-between py-8">
        <Link href="/" className="type-wide text-[18px] tracking-tight hover:text-accent">
          SM
        </Link>
        <nav className="flex gap-6 font-mono text-[12px] uppercase tracking-[0.12em] text-white/70">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <Link href="/blog" className="hover:text-accent">
            Blog
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
        <span>© Sourav Mallick</span>
        <span className="flex gap-5">
          <a href="https://github.com/Franky1107" target="_blank" rel="noreferrer" className="hover:text-accent">GitHub</a>
          <a href="https://www.linkedin.com/in/sourav-mallick1107" target="_blank" rel="noreferrer" className="hover:text-accent">LinkedIn</a>
          <a href="mailto:souravmallick900@gmail.com" className="hover:text-accent">Email</a>
        </span>
      </footer>
    </div>
  );
}
