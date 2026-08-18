import { prisma } from "@/lib/prisma";

export async function getIssueHistory() {
  return prisma.issueHistory.findMany({
    where: { asset: { deletedAt: null } },
    orderBy: { resolvedAt: "desc" },
  });
}

export async function getIssueHistoryByLocation(locationId: string) {
  return prisma.issueHistory.findMany({
    where: { asset: { locationId } },
    orderBy: { resolvedAt: "desc" },
  });
}

export async function getIssueHistoryByAsset(assetId: string) {
  return prisma.issueHistory.findMany({
    where: { assetId },
    orderBy: { resolvedAt: "desc" },
  });
}
