// Generates a simple SVG data URI placeholder image using the product's
// initials and a deterministic background color. Used when a product has
// no uploaded photo yet.
const palette = ["#EE4D2D", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

const colorForSeed = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const initialsFor = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

export function generatePlaceholderImage(name, color) {
  const bg = color ?? colorForSeed(name);
  const initials = initialsFor(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" rx="24" fill="${bg}" />
    <text x="50%" y="50%" dy=".08em" font-family="Arial, sans-serif" font-size="72" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
