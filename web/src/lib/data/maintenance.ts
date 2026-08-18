import { prisma } from "@/lib/prisma";

export async function getMaintenanceLogByAsset(assetId: string) {
  return prisma.maintenanceLog.findMany({
    where: { assetId },
    orderBy: { date: "desc" },
  });
}

export async function getDocumentsByAsset(assetId: string) {
  return prisma.document.findMany({
    where: { assetId },
    orderBy: { uploadedAt: "desc" },
  });
}
