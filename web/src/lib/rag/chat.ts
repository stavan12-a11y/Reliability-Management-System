import { getGemini, CHAT_MODEL } from "./client";
import type { HistorySource } from "./search";

export async function answerFromHistory(question: string, sources: HistorySource[]): Promise<string> {
  if (sources.length === 0) {
    return "No related history found.";
  }

  const spansMultipleAssets = new Set(sources.map((s) => s.assetId)).size > 1;
  const ai = getGemini();
  const context = sources
    .map((s, i) => {
      const label = s.kind === "issue_history" ? "Resolved issue" : "Maintenance record";
      return `[${i + 1}] ${label} — Asset ${s.assetId}, WO ${s.woNumber ?? "none on file"}, ${s.date.toISOString().slice(0, 10)}
Description: ${s.description}
${s.rootCause ? `Root cause: ${s.rootCause}\n` : ""}Failure mode: ${s.failureMode ?? "not classified"}
Component: ${s.component ?? "not classified"}`;
    })
    .join("\n\n");

  const citationInstruction = spansMultipleAssets
    ? "Every factual claim must cite its source record's asset ID and WO number in parentheses, e.g. (CHLR003, WO-116200) — since these records span multiple assets, the asset ID is required so the reader knows which equipment each fact is about."
    : "Every factual claim must cite its source record's WO number in parentheses, e.g. (WO-116200).";

  let res;
  try {
    res = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: `Records:\n\n${context}\n\nQuestion: ${question}`,
      config: {
        temperature: 0.2,
        systemInstruction:
          `You are a maintenance history assistant for a university utilities and energy services team. Answer the technician's question using ONLY the numbered records provided below — never use outside knowledge about the equipment. ${citationInstruction} If none of the provided records are actually relevant to the question, say so plainly instead of guessing or stretching a weak match.`,
      },
    });
  } catch (e) {
    // The Gemini SDK throws with the raw provider error body as .message
    // (often literal JSON) — surface a plain-English message instead of
    // leaking that to the UI.
    const raw = e instanceof Error ? e.message : "";
    if (raw.includes("UNAVAILABLE") || raw.includes("503")) {
      throw new Error("The AI model is temporarily overloaded (Gemini free tier). Please try asking again in a moment.");
    }
    if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
      throw new Error("Hit the Gemini free-tier rate limit. Please wait a minute and try again.");
    }
    throw new Error("The AI model failed to respond. Please try again.");
  }

  return res.text?.trim() || "The model did not return an answer.";
}
