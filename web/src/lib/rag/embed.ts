import { prisma } from "@/lib/prisma";
import { getOpenAI, EMBEDDING_MODEL } from "./client";

export async function embedText(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding;
}

function toVectorLiteral(vec: number[]) {
  return `[${vec.join(",")}]`;
}

// issue_history and maintenance_log embed the same shape of text: what
// happened + why + the controlled-vocabulary classification, so a question
// like "bearing problems" matches on failure_mode even if the free-text
// description phrases it differently ("excessive vibration").
export function embeddingSourceText(fields: { description: string; rootCause?: string | null; failureMode?: string | null; component?: string | null }) {
  return [fields.description, fields.rootCause, fields.failureMode?.replace(/_/g, " "), fields.component?.replace(/_/g, " ")].filter(Boolean).join(". ");
}

export async function embedAndStoreIssueHistory(id: string, text: string) {
  const vector = await embedText(text);
  await prisma.$executeRawUnsafe(`UPDATE "IssueHistory" SET embedding = $1::vector WHERE id = $2`, toVectorLiteral(vector), id);
}

export async function embedAndStoreMaintenanceLog(id: string, text: string) {
  const vector = await embedText(text);
  await prisma.$executeRawUnsafe(`UPDATE "MaintenanceLog" SET embedding = $1::vector WHERE id = $2`, toVectorLiteral(vector), id);
}
