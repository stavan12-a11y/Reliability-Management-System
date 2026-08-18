import { prisma } from "@/lib/prisma";

function withOverdue<T extends { returnEta: Date | null }>(issue: T) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = !!issue.returnEta && issue.returnEta < today;
  return { ...issue, overdue };
}

export async function getActiveIssues() {
  const rows = await prisma.issue.findMany({
    where: { asset: { deletedAt: null } },
    include: { asset: { include: { location: true, system: true } }, notes: { orderBy: { createdAt: "asc" } } },
    orderBy: { identifiedAt: "desc" },
  });
  return rows.map(withOverdue);
}

export async function getActiveIssuesByLocation(locationId: string) {
  const rows = await prisma.issue.findMany({
    where: { asset: { locationId, deletedAt: null } },
    include: { asset: { include: { location: true, system: true } }, notes: { orderBy: { createdAt: "asc" } } },
    orderBy: { identifiedAt: "desc" },
  });
  return rows.map(withOverdue);
}

export async function getActiveIssueByAssetId(assetId: string) {
  const row = await prisma.issue.findFirst({
    where: { assetId },
    include: { notes: { orderBy: { createdAt: "asc" } } },
  });
  return row ? withOverdue(row) : null;
}

export async function getIssueById(id: string) {
  const row = await prisma.issue.findUnique({
    where: { id },
    include: { asset: true, notes: { orderBy: { createdAt: "asc" } } },
  });
  return row ? withOverdue(row) : null;
}
