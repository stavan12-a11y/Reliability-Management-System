import { notFound } from "next/navigation";
import { getLocations, getSystemsByLocation } from "@/lib/data/locations";
import { getEquipmentByLocation } from "@/lib/data/equipment";
import { getActiveIssuesByLocation } from "@/lib/data/issues";
import { getIssueHistoryByLocation } from "@/lib/data/history";
import { fleetKpis } from "@/lib/data/kpis";
import { LocationsContent } from "./locations-content";

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locations = await getLocations();
  if (!locations.some((l) => l.id === id)) notFound();

  const [equipment, systems, issues, history] = await Promise.all([
    getEquipmentByLocation(id),
    getSystemsByLocation(id),
    getActiveIssuesByLocation(id),
    getIssueHistoryByLocation(id),
  ]);

  const locStats = fleetKpis(equipment, history);
  const counts = {
    available: equipment.filter((e) => e.status === "available").length,
    limited: equipment.filter((e) => e.status === "limited").length,
    unavailable: equipment.filter((e) => e.status === "unavailable").length,
  };

  return <LocationsContent locations={locations} selected={id} systems={systems} equipment={equipment} issues={issues} locStats={locStats} counts={counts} />;
}
