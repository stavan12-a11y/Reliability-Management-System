import { prisma } from "@/lib/prisma";
import { embedText } from "./embed";

export type HistorySource = {
  kind: "issue_history" | "maintenance_log";
  id: string;
  assetId: string;
  description: string;
  rootCause: string | null;
  failureMode: string | null;
  component: string | null;
  date: Date;
  woNumber: string | null;
  similarity: number;
};

function toVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

// Raw SQL because pgvector's <=> distance operator and the vector column
// itself aren't reachable through Prisma's normal query builder (see the
// `Unsupported("vector(1536)")` field in schema.prisma). Enum/`name`-typed
// columns are cast to ::text — the Neon driver adapter's raw-query
// deserializer doesn't know how to map custom Postgres types otherwise.
export async function searchHistory(question: string, opts: { assetId?: string; topN?: number } = {}): Promise<HistorySource[]> {
  const topN = opts.topN ?? 5;
  const vector = toVectorLiteral(await embedText(question));

  const [historyRows, maintenanceRows] = await Promise.all([
    prisma.$queryRawUnsafe<
      { id: string; assetId: string; description: string; rootCause: string; failureMode: string | null; component: string | null; resolvedAt: Date; woNumber: string | null; similarity: number }[]
    >(
      `SELECT id, "assetId", description, "rootCause", "failureMode"::text as "failureMode", "component"::text as "component", "resolvedAt", "woNumber", 1 - (embedding <=> $1::vector) AS similarity
       FROM "IssueHistory"
       WHERE embedding IS NOT NULL ${opts.assetId ? `AND "assetId" = $3` : ""}
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vector,
      topN,
      ...(opts.assetId ? [opts.assetId] : []),
    ),
    prisma.$queryRawUnsafe<
      { id: string; assetId: string; description: string; failureMode: string | null; component: string | null; date: Date; woNumber: string | null; similarity: number }[]
    >(
      `SELECT id, "assetId", description, "failureMode"::text as "failureMode", "component"::text as "component", date, "woNumber", 1 - (embedding <=> $1::vector) AS similarity
       FROM "MaintenanceLog"
       WHERE embedding IS NOT NULL ${opts.assetId ? `AND "assetId" = $3` : ""}
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vector,
      topN,
      ...(opts.assetId ? [opts.assetId] : []),
    ),
  ]);

  const combined: HistorySource[] = [
    ...historyRows.map((r) => ({
      kind: "issue_history" as const,
      id: r.id,
      assetId: r.assetId,
      description: r.description,
      rootCause: r.rootCause,
      failureMode: r.failureMode,
      component: r.component,
      date: r.resolvedAt,
      woNumber: r.woNumber,
      similarity: r.similarity,
    })),
    ...maintenanceRows.map((r) => ({
      kind: "maintenance_log" as const,
      id: r.id,
      assetId: r.assetId,
      description: r.description,
      rootCause: null,
      failureMode: r.failureMode,
      component: r.component,
      date: r.date,
      woNumber: r.woNumber,
      similarity: r.similarity,
    })),
  ];

  return combined.sort((a, b) => b.similarity - a.similarity).slice(0, topN);
}
