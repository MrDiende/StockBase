import { cn } from "../utils/classNames";

// A small colored pill. `variant` picks the color scheme:
// "neutral" | "green" | "amber" | "red" | "sky".
export function Badge({ children, variant = "neutral" }) {
  return <span className={cn("badge", `badge-${variant}`)}>{children}</span>;
}
