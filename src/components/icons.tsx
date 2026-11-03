// Small line icons for the funnel items (white, 1.5px strokes).
const base = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const CodeIcon = () => (
  <svg {...base}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M9.5 8.5 7.5 10l2 1.5M14.5 8.5l2 1.5-2 1.5M12.8 7.8l-1.6 4.4M9 20h6M12 16v4" />
  </svg>
);

export const LayersIcon = () => (
  <svg {...base}>
    <path d="m12 4 8 4-8 4-8-4 8-4Z" />
    <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
  </svg>
);

export const BarsIcon = () => (
  <svg {...base}>
    <path d="M4 20V14M9 20v-8M14 20V9M19 20V4" />
  </svg>
);
