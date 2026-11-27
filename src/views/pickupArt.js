// View artwork: hand-drawn 32-unit shapes shared by the canvas and the pickup display.
export const pickupColors = {
  ink: "--color-ink",
  paper: "--color-bg",
  white: "--color-surface",
  wood: "--color-sunken",
  rim: "--color-board-dot",
  amber: "--color-warning",
  apple: "--color-apple",
  leaf: "--color-success",
};

export const APPLE_ART = [
  { d: "M16 12c-1-4-2-6-4-8", stroke: "ink", width: 2.1 },
  { d: "M16 10c.6-4.5 4.1-7 8.5-7-1 4.9-4.2 7.4-8.5 7Z", fill: "leaf", stroke: "ink", width: 1.2 },
  { d: "M16 12c2-1.1 3.4-2 5.7-2 4.1 0 6.8 3.1 6.8 7.5 0 5.7-4 11.5-8.4 11.5-2 0-2.6-.9-4.1-.9s-2.1.9-4.1.9c-4.4 0-8.4-5.8-8.4-11.5C3.5 13.1 6.2 10 10.3 10c2.3 0 3.7.9 5.7 2Z", fill: "apple", stroke: "ink", width: 1.6 },
  { d: "M8.1 18.1c0-1.9 1.1-3.2 2.8-3.6", stroke: "white", width: 1.85 },
];

export const CRATE_ART = [
  { d: "M3.5 9 8 4h18l3 4.5v17L24 29H5a2 2 0 0 1-2-2V11a4 4 0 0 1 .5-2Z", fill: "wood", stroke: "ink", width: 1.8 },
  { d: "M23.5 10 29 8.5v17L24 29h-.5Z", fill: "amber", stroke: "ink", width: 1.4 },
  { d: "M3.5 9 8 4h18l3 4.5-5.5 2H4Z", fill: "paper", stroke: "ink", width: 1.4 },
  { d: "M6.7 14.3h13v11h-13Z", fill: "paper", stroke: "rim", width: 1.2 },
  { d: "M10.8 16.7c0-1.5 1.2-2.5 2.7-2.5 1.6 0 2.7 1 2.7 2.4 0 2-2.7 2.2-2.7 3.6m0 2.9h.01", stroke: "ink", width: 2.25 },
  { d: "M9.5 7.1h3.1m7 0h3.1", stroke: "amber", width: 1.4 },
  { d: "M26.2 14.1v7.7", stroke: "paper", width: 1.25 },
  { d: "M5.9 11h2.8v2.2H5.9Zm12.1 0h2.8v2.2H18Z", fill: "ink" },
];
