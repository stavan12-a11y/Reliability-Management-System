import { getLocations, getSystemsByLocation } from "@/lib/data/locations";
import { getEquipmentByLocation } from "@/lib/data/equipment";
import { getActiveIssuesByLocation } from "@/lib/data/issues";
import { getIssueHistoryByLocation } from "@/lib/data/history";
import { fleetKpis } from "@/lib/data/kpis";
import { LocationsContent } from "./locations-content";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ loc?: string }> }) {
  const { loc } = await searchParams;
  const locations = await getLocations();
  const selected = loc && locations.some((l) => l.id === loc) ? loc : locations[0]?.id ?? "";

  const [equipment, systems, issues, history] = await Promise.all([
    getEquipmentByLocation(selected),
    getSystemsByLocation(selected),
    getActiveIssuesByLocation(selected),
    getIssueHistoryByLocation(selected),
  ]);

  const locStats = fleetKpis(equipment, history);
  const counts = {
    available: equipment.filter((e) => e.status === "available").length,
    limited: equipment.filter((e) => e.status === "limited").length,
    unavailable: equipment.filter((e) => e.status === "unavailable").length,
  };

  return (
    <LocationsContent
      locations={locations}
      selected={selected}
      systems={systems}
      equipment={equipment}
      issues={issues}
      locStats={locStats}
      counts={counts}
    />
  );
}
