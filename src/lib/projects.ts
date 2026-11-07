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
  {
    name: "Order Lifecycle Integrity System",
    type: "Data Engineering · PySpark, Power BI",
    year: "2026",
    description: "A scalable PySpark pipeline that tracks every order through its lifecycle and flags duplicates, missing stages and invalid transitions, with Power BI dashboards on top.",
    image: "/projects/orders.jpg",
    hue: 350,
  },
  {
    name: "AI Summarizer Pro",
    type: "AI Application · React, Node.js, LLM APIs",
    year: "2025",
    description: "Turns long text, webpages and documents into short, faithful summaries — shipped as a Chrome extension and a web app.",
    image: "/projects/summarizer.jpg",
    hue: 210,
  },
  {
    name: "Video Conferencing App",
    type: "Web Application · WebRTC, Socket.io",
    year: "",
    description: "Real-time video calls with chat and screen sharing, built on WebRTC and Socket.io for low-latency communication.",
    image: "/projects/video.jpg",
    hue: 160,
  },
  {
    name: "Pulse — Data Quality Monitor",
    type: "Sample project",
    year: "",
    description: "Sample placeholder — a heat-map view of data-quality checks across tables and runs. Replace with a real project.",
    image: "/projects/quality.jpg",
    hue: 32,
  },
  {
    name: "Knowledge Graph Explorer",
    type: "Sample project",
    year: "",
    description: "Sample placeholder — an interactive map of how ideas and entities connect. Replace with a real project.",
    image: "/projects/graph.jpg",
    hue: 270,
  },
];
