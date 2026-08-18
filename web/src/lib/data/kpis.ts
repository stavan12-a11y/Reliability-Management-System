import { criticalityTier } from "@/lib/theme";

// Trailing window used for availability/MTTR KPI calcs — BUILD_SPEC.md section 3.
export const PERIOD_DAYS = 90;

export type KpiEquipment = { id: string; critScore: number; downtimeDays90d: number };
export type KpiHistoryRow = { assetId: string; downtimeDays: number; resolvedAt: Date };

export function assetAvailabilityPct(downtimeDays90d: number) {
  const pct = ((PERIOD_DAYS - downtimeDays90d) / PERIOD_DAYS) * 100;
  return Math.round(pct * 10) / 10;
}

export function fleetKpis(equipmentList: KpiEquipment[], historyList: KpiHistoryRow[]) {
  const totalDays = equipmentList.length * PERIOD_DAYS;
  const totalDowntime = equipmentList.reduce((s, e) => s + e.downtimeDays90d, 0);
  const availabilityPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;

  const criticalAssets = equipmentList.filter((e) => criticalityTier(e.critScore).label === "Very High");
  const criticalDays = criticalAssets.length * PERIOD_DAYS;
  const criticalDowntime = criticalAssets.reduce((s, e) => s + e.downtimeDays90d, 0);
  const criticalAvailabilityPct = criticalDays > 0 ? Math.round(((criticalDays - criticalDowntime) / criticalDays) * 1000) / 10 : 100;

  const relevantHistory = historyList.filter((h) => equipmentList.some((e) => e.id === h.assetId));
  const mttrDays = relevantHistory.length > 0 ? Math.round((relevantHistory.reduce((s, h) => s + h.downtimeDays, 0) / relevantHistory.length) * 10) / 10 : null;

  // MTBF ≈ uptime / failure count over the same trailing window — the
  // reliability-engineering complement to MTTR (how often things break,
  // not just how long a repair takes once it does).
  const uptimeDays = totalDays - totalDowntime;
  const mtbfDays = relevantHistory.length > 0 ? Math.round((uptimeDays / relevantHistory.length) * 10) / 10 : null;

  const assetCounts: Record<string, number> = {};
  relevantHistory.forEach((h) => {
    assetCounts[h.assetId] = (assetCounts[h.assetId] || 0) + 1;
  });
  const repeatOffenders = Object.values(assetCounts).filter((c) => c > 1).length;

  return { availabilityPct, criticalAvailabilityPct, mttrDays, mtbfDays, repeatOffenders, totalDowntime };
}

// Buckets resolved-issue downtime by calendar month to approximate a fleet
// availability trend over time. Only resolved issues carry a date to bucket
// by (active issues' downtime is already folded into the current 90d
// rollup used elsewhere) — good enough for a trend line, not meant to be
// forensically precise for a partially-elapsed current month.
export function monthlyAvailabilityTrend(equipmentCount: number, historyList: KpiHistoryRow[], months = 6) {
  const now = new Date();
  const buckets: { label: string; value: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const daysInMonth = monthEnd.getDate();

    const downtime = historyList
      .filter((h) => h.resolvedAt >= monthStart && h.resolvedAt <= monthEnd)
      .reduce((s, h) => s + h.downtimeDays, 0);

    const totalDays = equipmentCount * daysInMonth;
    const pct = totalDays > 0 ? Math.max(0, Math.min(100, Math.round(((totalDays - downtime) / totalDays) * 1000) / 10)) : 100;

    buckets.push({ label: monthStart.toLocaleDateString("en-US", { month: "short" }), value: pct });
  }

  return buckets;
}

export function daysBetween(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}
