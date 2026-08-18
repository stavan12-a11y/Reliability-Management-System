"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { daysBetween } from "@/lib/data/kpis";
import { revalidateDashboard } from "@/lib/actions/revalidate";
import { redirect } from "next/navigation";
import { embedAndStoreIssueHistory, embeddingSourceText } from "@/lib/rag/embed";
import { isRagConfigured } from "@/lib/rag/client";

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const createIssueSchema = z.object({
  assetId: z.string().min(1),
  condition: z.enum(["unavailable", "limited"]),
  description: z.string().min(1),
  nextStep: z.string().optional(),
  responsible: z.string().optional(),
  returnEta: optionalDate,
  woNumber: z.string().optional(),
});

export type CreateIssueState = { error?: string } | undefined;

export async function createIssue(_prev: CreateIssueState, formData: FormData): Promise<CreateIssueState> {
  const user = await requireRole("technician");

  const parsed = createIssueSchema.safeParse({
    assetId: formData.get("assetId"),
    condition: formData.get("condition"),
    description: formData.get("description"),
    nextStep: formData.get("nextStep") || undefined,
    responsible: formData.get("responsible") || undefined,
    returnEta: formData.get("returnEta") || undefined,
    woNumber: formData.get("woNumber") || undefined,
  });
  if (!parsed.success) return { error: "Please fill in the required fields." };
  const data = parsed.data;

  const today = new Date();
  const identifiedAt = new Date(today.toISOString().slice(0, 10));

  await prisma.$transaction(async (tx) => {
    const created = await tx.issue.create({
      data: {
        assetId: data.assetId,
        condition: data.condition,
        description: data.description,
        identifiedAt,
        nextStep: data.nextStep || "Not yet determined",
        responsible: data.responsible || "Unassigned",
        returnEta: data.returnEta ? new Date(data.returnEta) : null,
        woNumber: data.woNumber || null,
        createdById: user.id,
        updatedById: user.id,
        notes: { create: { body: `Issue logged: ${data.description}`, createdById: user.id } },
      },
    });
    await tx.equipment.update({ where: { id: data.assetId }, data: { status: data.condition } });
    return created;
  });

  revalidateDashboard(data.assetId);
  redirect(`/equipment/${data.assetId}`);
}

const quickUpdateSchema = z.object({
  nextStep: z.string().min(1),
  returnEta: optionalDate,
});

export async function quickUpdateIssue(issueId: string, input: { nextStep: string; returnEta?: string | null }) {
  const user = await requireRole("technician");
  const data = quickUpdateSchema.parse(input);

  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      nextStep: data.nextStep,
      returnEta: data.returnEta ? new Date(data.returnEta) : null,
      updatedById: user.id,
    },
  });

  revalidateDashboard(issue.assetId);
}

const fullEditSchema = z.object({
  description: z.string().min(1),
  nextStep: z.string().min(1),
  responsible: z.string().min(1),
  partsEta: optionalDate,
  returnEta: optionalDate,
  woNumber: z.string().optional().nullable(),
});

export async function fullEditIssue(
  issueId: string,
  input: { description: string; nextStep: string; responsible: string; partsEta?: string | null; returnEta?: string | null; woNumber?: string | null },
) {
  const user = await requireRole("manager");
  const data = fullEditSchema.parse(input);

  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      description: data.description,
      nextStep: data.nextStep,
      responsible: data.responsible,
      partsEta: data.partsEta ? new Date(data.partsEta) : null,
      returnEta: data.returnEta ? new Date(data.returnEta) : null,
      woNumber: data.woNumber || null,
      updatedById: user.id,
    },
  });

  revalidateDashboard(issue.assetId);
}

export async function deleteIssue(issueId: string) {
  await requireRole("manager");
  const issue = await prisma.issue.delete({ where: { id: issueId } });
  revalidateDashboard(issue.assetId);
}

const resolveFullSchema = z.object({
  workDone: z.string().min(1),
  rootCause: z.string().min(1),
  resolvedDate: z.string().min(1),
  failureMode: z.string().optional().nullable(),
  component: z.string().optional().nullable(),
});

export async function resolveIssueFull(
  issueId: string,
  input: { workDone: string; rootCause: string; resolvedDate: string; failureMode?: string | null; component?: string | null },
) {
  const user = await requireRole("manager");
  const data = resolveFullSchema.parse(input);

  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId } });
  const resolvedAt = new Date(data.resolvedDate);
  const downtimeDays = daysBetween(issue.identifiedAt, resolvedAt);
  const historyId = randomUUID();

  await prisma.$transaction([
    prisma.issueHistory.create({
      data: {
        id: historyId,
        assetId: issue.assetId,
        description: data.workDone,
        rootCause: data.rootCause,
        // Cast through unknown: these come from a plain <select> of enum
        // value strings, not typed input — Prisma still validates them
        // against the enum at the database layer.
        failureMode: (data.failureMode || null) as never,
        component: (data.component || null) as never,
        resolvedAt,
        identifiedAt: issue.identifiedAt,
        downtimeDays,
        woNumber: issue.woNumber,
        resolvedById: user.id,
      },
    }),
    prisma.issue.delete({ where: { id: issueId } }),
    prisma.equipment.update({
      where: { id: issue.assetId },
      data: { status: "available", downtimeDays90d: { increment: downtimeDays } },
    }),
  ]);

  revalidateDashboard(issue.assetId);

  // Best-effort: a transient embedding failure shouldn't roll back a
  // resolution that already succeeded. The nightly/backfill job can catch
  // any record left without an embedding.
  if (isRagConfigured()) {
    try {
      await embedAndStoreIssueHistory(historyId, embeddingSourceText({ description: data.workDone, rootCause: data.rootCause, failureMode: data.failureMode, component: data.component }));
    } catch (e) {
      console.error("Failed to embed issue history record", historyId, e);
    }
  }
}

const downgradeSchema = z.object({ note: z.string().min(1) });

export async function downgradeIssue(issueId: string, input: { note: string }) {
  const user = await requireRole("manager");
  const data = downgradeSchema.parse(input);

  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId } });

  await prisma.$transaction([
    prisma.issue.update({
      where: { id: issueId },
      data: { condition: "limited", updatedById: user.id, notes: { create: { body: `Downgraded to limited: ${data.note}`, createdById: user.id } } },
    }),
    prisma.equipment.update({ where: { id: issue.assetId }, data: { status: "limited" } }),
  ]);

  revalidateDashboard(issue.assetId);
}
