"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { revalidateDashboard } from "@/lib/actions/revalidate";
import { embedAndStoreMaintenanceLog, embeddingSourceText } from "@/lib/rag/embed";
import { isRagConfigured } from "@/lib/rag/client";

const logMaintenanceSchema = z.object({
  assetId: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(["overhaul", "component_replacement", "test", "inspection", "other"]),
  description: z.string().min(1),
  woNumber: z.string().optional().nullable(),
  failureMode: z.string().optional().nullable(),
  component: z.string().optional().nullable(),
});

export async function logMaintenanceEntry(input: {
  assetId: string;
  date: string;
  type: string;
  description: string;
  woNumber?: string | null;
  failureMode?: string | null;
  component?: string | null;
}) {
  const user = await requireRole("technician");
  const data = logMaintenanceSchema.parse(input);

  const created = await prisma.maintenanceLog.create({
    data: {
      assetId: data.assetId,
      date: new Date(data.date),
      type: data.type,
      description: data.description,
      woNumber: data.woNumber || null,
      // Cast through unknown: these come from a plain <select> of enum
      // value strings, not typed input — Prisma still validates them
      // against the enum at the database layer.
      failureMode: (data.failureMode || null) as never,
      component: (data.component || null) as never,
      createdById: user.id,
    },
  });

  revalidateDashboard(data.assetId);

  // Best-effort, same pattern as resolveIssueFull: a transient embedding
  // failure shouldn't block the maintenance record from being saved.
  if (isRagConfigured()) {
    try {
      await embedAndStoreMaintenanceLog(created.id, embeddingSourceText({ description: data.description, failureMode: data.failureMode, component: data.component }));
    } catch (e) {
      console.error("Failed to embed maintenance log record", created.id, e);
    }
  }
}

const uploadDocumentSchema = z.object({
  assetId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["manual", "certificate", "report", "photo"]),
  fileUrl: z.string().min(1),
});

// fileUrl is a data: URL (base64), not a link into external blob storage —
// no storage provider is configured, so the file content is stored
// directly in the fileUrl column. Fine for the small spec sheets/photos a
// demo asset accumulates; the client caps upload size before calling this.
export async function uploadDocument(input: { assetId: string; name: string; type: string; fileUrl: string }) {
  const user = await requireRole("technician");
  const data = uploadDocumentSchema.parse(input);

  await prisma.document.create({
    data: {
      assetId: data.assetId,
      name: data.name,
      type: data.type,
      fileUrl: data.fileUrl,
      uploadedById: user.id,
    },
  });

  revalidateDashboard(data.assetId);
}
