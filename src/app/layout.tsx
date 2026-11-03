import type { Metadata } from "next";

// Self-hosted variable fonts (no request to Google at runtime).
// Archivo "wdth" gives us both the extra-wide name and the heavy heading.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sourav Mallick — Software Engineer",
  description:
    "Software Engineer working across data engineering, AI and intelligent systems, transforming complex data into meaningful solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">{children}</body>
    </html>
  );
}
