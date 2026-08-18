import { getEquipmentList } from "@/lib/data/equipment";
import { getActiveIssues } from "@/lib/data/issues";
import { getIssueHistory } from "@/lib/data/history";
import { getLocationSummaries } from "@/lib/data/locations";
import { fleetKpis } from "@/lib/data/kpis";
import { OverviewContent } from "./overview-content";

export default async function OverviewPage() {
  const [equipment, issues, history, locationSummaries] = await Promise.all([
    getEquipmentList(),
    getActiveIssues(),
    getIssueHistory(),
    getLocationSummaries(),
  ]);

  const counts = {
    unavailable: equipment.filter((e) => e.status === "unavailable").length,
    limited: equipment.filter((e) => e.status === "limited").length,
    overdue: issues.filter((i) => i.overdue).length,
    awaitingParts: issues.filter((i) => i.partsEta).length,
  };

  const fleetStats = fleetKpis(equipment, history);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const newSinceYesterday = issues.filter((i) => i.createdAt >= startOfToday).length;

  const critScoreByAsset = new Map(equipment.map((e) => [e.id, e.critScore]));
  const sortedIssues = [...issues].sort((a, b) => {
    if ((b.overdue ? 1 : 0) !== (a.overdue ? 1 : 0)) return (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0);
    return (critScoreByAsset.get(b.assetId) || 0) - (critScoreByAsset.get(a.assetId) || 0);
  });

  return <OverviewContent counts={counts} fleetStats={fleetStats} issues={sortedIssues} newSinceYesterday={newSinceYesterday} locations={locationSummaries} />;
}
