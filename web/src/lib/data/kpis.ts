import { criticalityTier } from "@/lib/theme";

// Trailing window used for availability/MTTR KPI calcs — BUILD_SPEC.md section 3.
export const PERIOD_DAYS = 90;

export type KpiEquipment = { id: string; critScore: number; downtimeDays90d: number };
export type KpiHistoryRow = { assetId: string; downtimeDays: number };

export function assetAvailabilityPct(downtimeDays90d: number) {
  const pct = ((PERIOD_DAYS - downtimeDays90d) / PERIOD_DAYS) * 100;
  return Math.round(pct * 10) / 10;
}

export function fleetKpis(equipmentList: KpiEquipment[], historyList: KpiHistoryRow[]) {
  const totalDays = equipmentList.length * PERIOD_DAYS;
  const totalDowntime = equipmentList.reduce((s, e) => s + e.downtimeDays90d, 0);
  const availabilityPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;

  const criticalAssets = equipmentList.filter((e) => criticalityTier(e.critScore).label === "Critical");
  const criticalDays = criticalAssets.length * PERIOD_DAYS;
  const criticalDowntime = criticalAssets.reduce((s, e) => s + e.downtimeDays90d, 0);
  const criticalAvailabilityPct = criticalDays > 0 ? Math.round(((criticalDays - criticalDowntime) / criticalDays) * 1000) / 10 : 100;

  const relevantHistory = historyList.filter((h) => equipmentList.some((e) => e.id === h.assetId));
  const mttrDays = relevantHistory.length > 0 ? Math.round((relevantHistory.reduce((s, h) => s + h.downtimeDays, 0) / relevantHistory.length) * 10) / 10 : null;

  const assetCounts: Record<string, number> = {};
  relevantHistory.forEach((h) => {
    assetCounts[h.assetId] = (assetCounts[h.assetId] || 0) + 1;
  });
  const repeatOffenders = Object.values(assetCounts).filter((c) => c > 1).length;

  return { availabilityPct, criticalAvailabilityPct, mttrDays, repeatOffenders, totalDowntime };
}

export function daysBetween(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}
