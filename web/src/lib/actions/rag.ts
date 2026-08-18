"use server";

import { getCurrentUser } from "@/lib/session";
import { searchHistory, type HistorySource } from "@/lib/rag/search";
import { resolveQuestionScope } from "@/lib/rag/scope";
import { answerFromHistory } from "@/lib/rag/chat";
import { isRagConfigured } from "@/lib/rag/client";

export type AskHistorySource = { kind: string; id: string; woNumber: string | null; date: string; description: string; assetId: string };
export type AskHistoryResult = { answer: string; sources: AskHistorySource[]; error?: string };

// A secondary "did another asset of the same class have this exact
// problem" search only surfaces results whose vector similarity clears
// this bar — otherwise every question about one boiler would drag in
// loosely-related history from every other boiler too.
const RELATED_ASSET_SIMILARITY_FLOOR = 0.6;

export async function askHistory(question: string): Promise<AskHistoryResult> {
  const user = await getCurrentUser();
  if (!user) return { answer: "", sources: [], error: "You must be signed in." };
  if (!question.trim()) return { answer: "", sources: [], error: "Ask a question first." };
  if (!isRagConfigured()) {
    return { answer: "", sources: [], error: "AI history lookup isn't configured yet — an administrator needs to add a GEMINI_API_KEY." };
  }

  try {
    const scope = await resolveQuestionScope(question);

    let sources: HistorySource[];
    if (scope.assetId) {
      // Named a specific asset: search just that asset, plus (if it has a
      // class) a widened same-class search for genuinely similar problems
      // on other equipment of the same type — filtered by similarity so
      // unrelated history on sibling assets doesn't sneak in.
      const primary = await searchHistory(question, { assetId: scope.assetId, topN: 5 });
      const related = scope.assetClass
        ? (await searchHistory(question, { assetClass: scope.assetClass, excludeAssetId: scope.assetId, topN: 4 })).filter((s) => s.similarity >= RELATED_ASSET_SIMILARITY_FLOOR)
        : [];
      sources = [...primary, ...related].sort((a, b) => b.similarity - a.similarity);
    } else if (scope.assetClass) {
      // Named a class ("boiler") but no specific asset: search across every
      // asset of that class only.
      sources = await searchHistory(question, { assetClass: scope.assetClass, topN: 8 });
    } else {
      // No asset or class mentioned: fall back to a global search.
      sources = await searchHistory(question, { topN: 8 });
    }

    const answer = await answerFromHistory(question, sources);
    return {
      answer,
      sources: sources.map((s) => ({ kind: s.kind, id: s.id, woNumber: s.woNumber, date: s.date.toISOString().slice(0, 10), description: s.description, assetId: s.assetId })),
    };
  } catch (e) {
    return { answer: "", sources: [], error: e instanceof Error ? e.message : "Something went wrong asking the AI." };
  }
}
