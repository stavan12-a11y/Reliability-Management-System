"use server";

import { getCurrentUser } from "@/lib/session";
import { searchHistory } from "@/lib/rag/search";
import { answerFromHistory } from "@/lib/rag/chat";
import { isRagConfigured } from "@/lib/rag/client";

export type AskHistorySource = { kind: string; id: string; woNumber: string | null; date: string; description: string; assetId: string };
export type AskHistoryResult = { answer: string; sources: AskHistorySource[]; error?: string };

// assetId is optional: pass it to scope retrieval to one asset (the
// equipment profile page did this before the widget went global), omit it
// to search across every asset's history/maintenance records.
export async function askHistory(question: string, assetId?: string): Promise<AskHistoryResult> {
  const user = await getCurrentUser();
  if (!user) return { answer: "", sources: [], error: "You must be signed in." };
  if (!question.trim()) return { answer: "", sources: [], error: "Ask a question first." };
  if (!isRagConfigured()) {
    return { answer: "", sources: [], error: "AI history lookup isn't configured yet — an administrator needs to add a GEMINI_API_KEY." };
  }

  try {
    const sources = await searchHistory(question, { assetId, topN: assetId ? 5 : 8 });
    const answer = await answerFromHistory(question, sources);
    return {
      answer,
      sources: sources.map((s) => ({ kind: s.kind, id: s.id, woNumber: s.woNumber, date: s.date.toISOString().slice(0, 10), description: s.description, assetId: s.assetId })),
    };
  } catch (e) {
    return { answer: "", sources: [], error: e instanceof Error ? e.message : "Something went wrong asking the AI." };
  }
}
