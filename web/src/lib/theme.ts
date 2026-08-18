// Status/criticality → Tailwind class mappings, matching the pill-badge
// pattern used across the other TAMU UES dashboards (PSV/Steam
// Trap/Boiler): bg-{color}-100 text-{color}-800 ring-{color}-600/20.

export const statusMeta = {
  available: { label: "Available", badge: "bg-emerald-100 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-500" },
  limited: { label: "Limited", badge: "bg-amber-100 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  unavailable: { label: "Unavailable", badge: "bg-red-100 text-red-800 ring-red-600/20", dot: "bg-red-500" },
} as const;

export type StatusKey = keyof typeof statusMeta;

export function criticalityTier(score: number) {
  if (score >= 17) return { label: "Critical", badge: "bg-red-100 text-red-800 ring-red-600/20", text: "text-red-700" };
  if (score >= 10) return { label: "High", badge: "bg-orange-100 text-orange-800 ring-orange-600/20", text: "text-orange-700" };
  if (score >= 5) return { label: "Medium", badge: "bg-amber-100 text-amber-800 ring-amber-600/20", text: "text-amber-700" };
  return { label: "Low", badge: "bg-emerald-100 text-emerald-800 ring-emerald-600/20", text: "text-emerald-700" };
}

export function availabilityTextColor(pct: number | null | undefined) {
  if (pct == null) return "text-slate-400";
  if (pct >= 97) return "text-emerald-600";
  if (pct >= 90) return "text-amber-600";
  return "text-red-600";
}
