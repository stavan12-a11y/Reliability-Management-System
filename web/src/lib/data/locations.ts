import { prisma } from "@/lib/prisma";

export async function getLocations() {
  return prisma.location.findMany({ orderBy: { id: "asc" } });
}

export async function getSystemsByLocation(locationId: string) {
  return prisma.system.findMany({ where: { locationId }, orderBy: { id: "asc" } });
}
