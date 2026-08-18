import { prisma } from "@/lib/prisma";
import { fleetKpis } from "@/lib/data/kpis";

export async function getLocations() {
  return prisma.location.findMany({ orderBy: { id: "asc" } });
}

export async function getSystemsByLocation(locationId: string) {
  return prisma.system.findMany({ where: { locationId }, orderBy: { id: "asc" } });
}

export async function getAllSystems() {
  return prisma.system.findMany({ orderBy: { id: "asc" } });
}

// Per-location rollup for the location cards on the Overview page.
export async function getLocationSummaries() {
  const [locations, equipmentRaw, history, issues] = await Promise.all([
    prisma.location.findMany({ orderBy: { id: "asc" } }),
    prisma.equipment.findMany({
      where: { deletedAt: null },
      select: { id: true, locationId: true, status: true, critScore: true, downtimeDays90d: true },
    }),
    prisma.issueHistory.findMany({
      where: { asset: { deletedAt: null } },
      select: { assetId: true, downtimeDays: true, resolvedAt: true },
    }),
    prisma.issue.findMany({
      where: { asset: { deletedAt: null } },
      select: { assetId: true, asset: { select: { locationId: true } } },
    }),
  ]);

  const equipment = equipmentRaw.map((e) => ({ ...e, downtimeDays90d: Number(e.downtimeDays90d) }));

  return locations.map((loc) => {
    const eq = equipment.filter((e) => e.locationId === loc.id);
    const stats = fleetKpis(eq, history);
    return {
      id: loc.id,
      name: loc.name,
      total: eq.length,
      available: eq.filter((e) => e.status === "available").length,
      limited: eq.filter((e) => e.status === "limited").length,
      unavailable: eq.filter((e) => e.status === "unavailable").length,
      availabilityPct: stats.availabilityPct,
      activeIssues: issues.filter((i) => i.asset.locationId === loc.id).length,
    };
  });
}
