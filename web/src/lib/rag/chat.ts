import { getGemini, CHAT_MODEL } from "./client";
import type { HistorySource } from "./search";

export async function answerFromHistory(question: string, sources: HistorySource[], dashboardContext: string | null): Promise<string> {
  if (sources.length === 0 && !dashboardContext) {
    return "No related information found.";
  }

  const spansMultipleAssets = new Set(sources.map((s) => s.assetId)).size > 1;
  const ai = getGemini();

  const historyBlock = sources
    .map((s, i) => {
      const label = s.kind === "issue_history" ? "Resolved issue" : "Maintenance record";
      return `[${i + 1}] ${label} — Asset ${s.assetId}, WO ${s.woNumber ?? "none on file"}, ${s.date.toISOString().slice(0, 10)}
Description: ${s.description}
${s.rootCause ? `Root cause: ${s.rootCause}\n` : ""}Failure mode: ${s.failureMode ?? "not classified"}
Component: ${s.component ?? "not classified"}`;
    })
    .join("\n\n");

  const sections = [
    dashboardContext ? `CURRENT DASHBOARD DATA (live — KPIs, nameplate, status; not a historical record):\n${dashboardContext}` : null,
    historyBlock ? `NUMBERED HISTORICAL RECORDS (past work orders):\n\n${historyBlock}` : null,
  ].filter(Boolean);

  const citationInstruction = spansMultipleAssets
    ? "When citing a numbered historical record, include both the asset ID and WO number in parentheses, e.g. (CHLR003, WO-116200) — these records span multiple assets, so the asset ID is required so the reader knows which equipment each fact is about."
    : "When citing a numbered historical record, include its WO number in parentheses, e.g. (WO-116200).";

  let res;
  try {
    res = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: `${sections.join("\n\n")}\n\nQuestion: ${question}`,
      config: {
        temperature: 0.2,
        systemInstruction:
          `You are an assistant for a university utilities and energy services reliability dashboard. Answer the technician's question using ONLY the information provided below — never use outside knowledge about the equipment. There are two kinds of information, and they follow different citation rules: (1) "Current dashboard data" is live data straight from the system right now (KPIs like availability/MTTR/MTBF, nameplate specs, current status, criticality, active issues) — state these facts directly, no citation needed, since they aren't historical records. (2) "Numbered historical records" are past work orders — ${citationInstruction} If the question asks about something not covered by either section, say so plainly instead of guessing or stretching a weak match.`,
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
