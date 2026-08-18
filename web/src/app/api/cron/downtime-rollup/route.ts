import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cron-auth";
import { PERIOD_DAYS } from "@/lib/data/kpis";

// Recalculates equipment.downtimeDays90d from scratch each night, summing
// issue_history within the trailing 90-day window. This is what makes
// resolutions older than 90 days "roll off" — see BUILD_SPEC.md section 3.
export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PERIOD_DAYS);

  const sums = await prisma.issueHistory.groupBy({
    by: ["assetId"],
    where: { resolvedAt: { gte: cutoff } },
    _sum: { downtimeDays: true },
  });

  const sumByAsset = new Map(sums.map((s) => [s.assetId, s._sum.downtimeDays ?? 0]));
  const allEquipment = await prisma.equipment.findMany({ select: { id: true } });

  await prisma.$transaction(
    allEquipment.map((e) =>
      prisma.equipment.update({
        where: { id: e.id },
        data: { downtimeDays90d: sumByAsset.get(e.id) ?? 0 },
      }),
    ),
  );

  return NextResponse.json({ ok: true, assetsUpdated: allEquipment.length, cutoff });
}
