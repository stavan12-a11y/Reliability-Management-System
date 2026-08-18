import { getEquipmentList } from "@/lib/data/equipment";
import { getIssueHistory } from "@/lib/data/history";
import { getActiveIssues } from "@/lib/data/issues";
import { ReportsContent } from "./reports-content";

export default async function ReportsPage() {
  const [equipment, history, issues] = await Promise.all([getEquipmentList(), getIssueHistory(), getActiveIssues()]);

  const byClass: Record<string, { total: number; unavailable: number; limited: number }> = {};
  equipment.forEach((e) => {
    if (!byClass[e.class]) byClass[e.class] = { total: 0, unavailable: 0, limited: 0 };
    byClass[e.class].total++;
    if (e.status === "unavailable") byClass[e.class].unavailable++;
    if (e.status === "limited") byClass[e.class].limited++;
  });

  const totalDowntime = history.reduce((s, h) => s + h.downtimeDays, 0) + equipment.reduce((s, e) => s + e.downtimeDays90d, 0);
  const overdueCount = issues.filter((i) => i.overdue).length;

  const assetCounts: Record<string, number> = {};
  history.forEach((h) => {
    assetCounts[h.assetId] = (assetCounts[h.assetId] || 0) + 1;
  });
  const recurring = Object.entries(assetCounts).filter(([, c]) => c > 1);

  // Pareto analysis: which failure modes account for the most resolved
  // issues, ranked descending so the "vital few" causes are obvious.
  const failureModeCounts: Record<string, number> = {};
  history.forEach((h) => {
    if (!h.failureMode) return;
    const label = h.failureMode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    failureModeCounts[label] = (failureModeCounts[label] || 0) + 1;
  });
  const failureModePareto = Object.entries(failureModeCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return <ReportsContent byClass={byClass} totalDowntime={totalDowntime} overdueCount={overdueCount} recurring={recurring} failureModePareto={failureModePareto} />;
}
