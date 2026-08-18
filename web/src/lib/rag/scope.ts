import { prisma } from "@/lib/prisma";

export type QuestionScope = { assetId?: string; assetClass?: string };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Looks for an explicit asset ID (e.g. "CHLR003") or an equipment class
// name (e.g. "boiler"/"boilers") mentioned in the question, so retrieval
// can be scoped to the right equipment instead of searching every asset.
// Asset ID match wins — it's the more specific signal.
export async function resolveQuestionScope(question: string): Promise<QuestionScope> {
  const equipment = await prisma.equipment.findMany({ where: { deletedAt: null }, select: { id: true, class: true } });

  for (const e of equipment) {
    if (new RegExp(`\\b${escapeRegExp(e.id)}\\b`, "i").test(question)) {
      return { assetId: e.id, assetClass: e.class };
    }
  }

  const classes = Array.from(new Set(equipment.map((e) => e.class)));
  for (const c of classes) {
    if (new RegExp(`\\b${escapeRegExp(c)}s?\\b`, "i").test(question)) {
      return { assetClass: c };
    }
  }

  return {};
}
