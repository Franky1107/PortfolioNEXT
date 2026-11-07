import { marked } from "marked";

// shortcut: Markdown → HTML without sanitising; fine while only the admin writes posts — sanitise if you ever accept guest posts
export const renderMarkdown = (md: string) => marked.parse(md, { async: false, gfm: true }) as string;

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

export const readingMinutes = (md: string) => Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 220));
