import { prisma } from "@/lib/prisma";

function toNum(d: unknown) {
  return Number(d);
}

export async function getEquipmentList() {
  const rows = await prisma.equipment.findMany({
    where: { deletedAt: null },
    include: { system: true, location: true },
    orderBy: { id: "asc" },
  });
  return rows.map((e) => ({ ...e, downtimeDays90d: toNum(e.downtimeDays90d) }));
}

export async function getEquipmentByLocation(locationId: string) {
  const rows = await prisma.equipment.findMany({
    where: { deletedAt: null, locationId },
    include: { system: true, location: true },
    orderBy: { id: "asc" },
  });
  return rows.map((e) => ({ ...e, downtimeDays90d: toNum(e.downtimeDays90d) }));
}

export async function getEquipmentById(id: string) {
  const e = await prisma.equipment.findFirst({
    where: { id, deletedAt: null },
    include: { system: true, location: true },
  });
  if (!e) return null;
  return { ...e, downtimeDays90d: toNum(e.downtimeDays90d) };
}

// Lightweight list for the asset picker in the "Log new issue" modal / global search.
export async function getEquipmentPickerList() {
  return prisma.equipment.findMany({
    where: { deletedAt: null },
    select: { id: true, assetNumber: true, manufacturer: true, model: true, locationId: true, critScore: true },
    orderBy: { id: "asc" },
  });
}

export async function findEquipmentByIdOrAssetNumber(query: string) {
  return prisma.equipment.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: { equals: query, mode: "insensitive" } }, { assetNumber: { equals: query, mode: "insensitive" } }],
    },
    select: { id: true },
  });
}
