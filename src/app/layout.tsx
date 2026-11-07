import type { Metadata, Viewport } from "next";

// Self-hosted variable fonts (no request to Google at runtime).
// Archivo "wdth" gives us both the extra-wide name and the heavy heading.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Sourav Mallick — Software Engineer",
  description:
    "Software Engineer working across data engineering, AI and intelligent systems, transforming complex data into meaningful solutions.",
  // Dark Reader (and Brave's Night Mode, which is built on it) skips pages with
  // this tag, so it can't repaint the site's hand-picked colours
  other: { "darkreader-lock": "true" },
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
