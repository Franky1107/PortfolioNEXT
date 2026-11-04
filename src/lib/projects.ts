/**
 * YOUR PROJECTS — placeholders for now. Replace each entry with a real
 * project; add or remove entries freely.
 *   image: a path in /public (e.g. "/projects/pulse.jpg"), or leave it out to
 *          show the generated placeholder artwork
 *   hue:   colour of the placeholder artwork (0–360)
 */
export type Project = {
  name: string;
  type: string;
  year: string;
  description: string;
  href?: string;
  image?: string;
  hue: number;
};

export const PROJECTS: Project[] = [
  { name: "Project One", type: "Data Engineering", year: "2026", description: "Placeholder — one line about what this project does and why it matters.", hue: 350 },
  { name: "Project Two", type: "AI Application", year: "2025", description: "Placeholder — one line about what this project does and why it matters.", hue: 210 },
  { name: "Project Three", type: "Data Visualization", year: "2025", description: "Placeholder — one line about what this project does and why it matters.", hue: 32 },
  { name: "Project Four", type: "Web Application", year: "2024", description: "Placeholder — one line about what this project does and why it matters.", hue: 160 },
  { name: "Project Five", type: "Intelligent Systems", year: "2024", description: "Placeholder — one line about what this project does and why it matters.", hue: 270 },
];
