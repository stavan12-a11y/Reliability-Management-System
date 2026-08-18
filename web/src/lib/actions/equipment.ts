"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidateDashboard } from "@/lib/actions/revalidate";
import { redirect } from "next/navigation";

const editEquipmentSchema = z.object({
  assetNumber: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serial: z.string().min(1),
  nameplate: z.record(z.string(), z.string()),
});

export async function updateEquipment(
  assetId: string,
  input: { assetNumber: string; manufacturer: string; model: string; serial: string; nameplate: Record<string, string> },
) {
  await requireRole("manager");
  const data = editEquipmentSchema.parse(input);

  await prisma.equipment.update({
    where: { id: assetId },
    data: {
      assetNumber: data.assetNumber,
      manufacturer: data.manufacturer,
      model: data.model,
      serial: data.serial,
      nameplate: data.nameplate,
    },
  });

  revalidateDashboard(assetId);
}

// Soft delete — see BUILD_SPEC.md: "protect historical downtime/availability
// data from a mis-click." Active issues and history rows are left intact;
// getEquipment* queries filter deletedAt out of normal views.
export async function deleteEquipment(assetId: string) {
  await requireRole("manager");
  await prisma.equipment.update({ where: { id: assetId }, data: { deletedAt: new Date() } });
  revalidateDashboard(assetId);
  redirect("/equipment");
}
