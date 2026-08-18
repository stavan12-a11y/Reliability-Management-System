// Status/criticality → Tailwind class mappings for the tag-style badges in
// ui.tsx (StatusBadge, CriticalityBadge): bordered rounded-md chip with a
// tinted background, distinguished by dot shape (round = live equipment
// status, square = a static criticality rating).

export const statusMeta = {
  available: { label: "Available", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  limited: { label: "Limited", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  unavailable: { label: "Unavailable", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
} as const;

export type StatusKey = keyof typeof statusMeta;

export function criticalityTier(score: number) {
  if (score >= 17) return { label: "Very High", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-600" };
  if (score >= 10) return { label: "High", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" };
  if (score >= 5) return { label: "Medium", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
  return { label: "Low", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" };
}

export function availabilityTextColor(pct: number | null | undefined) {
  if (pct == null) return "text-slate-400";
  if (pct >= 97) return "text-emerald-600";
  if (pct >= 90) return "text-amber-600";
  return "text-red-600";
}
