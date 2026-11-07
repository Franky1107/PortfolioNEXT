import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-[100svh] w-full max-w-[1100px] px-5 pb-20 md:px-8">
      <header className="flex items-center justify-between py-7">
        <Link href="/admin" className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
          ( Blog admin )
        </Link>
        <Link href="/blog" className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/60 hover:text-accent">
          View blog ↗
        </Link>
      </header>
      {children}
    </div>
  );
}
