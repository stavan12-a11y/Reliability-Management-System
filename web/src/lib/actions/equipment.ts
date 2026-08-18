"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidateDashboard } from "@/lib/actions/revalidate";
import { redirect } from "next/navigation";

const createEquipmentSchema = z.object({
  id: z.string().min(1),
  assetNumber: z.string().min(1),
  locationId: z.string().min(1),
  systemId: z.string().min(1),
  class: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serial: z.string().min(1),
  critLikelihood: z.coerce.number().int().min(1).max(5),
  critConsequence: z.coerce.number().int().min(1).max(5),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;

export async function createEquipment(input: CreateEquipmentInput) {
  await requireRole("manager");
  const data = createEquipmentSchema.parse(input);

  const existing = await prisma.equipment.findUnique({ where: { id: data.id } });
  if (existing) {
    throw new Error(`Asset ID "${data.id}" already exists.`);
  }

  await prisma.equipment.create({
    data: {
      id: data.id,
      assetNumber: data.assetNumber,
      locationId: data.locationId,
      systemId: data.systemId,
      class: data.class,
      manufacturer: data.manufacturer,
      model: data.model,
      serial: data.serial,
      critLikelihood: data.critLikelihood,
      critConsequence: data.critConsequence,
      critScore: data.critLikelihood * data.critConsequence,
      nameplate: {},
      status: "available",
    },
  });

  revalidateDashboard(data.id);
}

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
