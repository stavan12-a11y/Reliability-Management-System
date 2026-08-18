import { getOpenAI, CHAT_MODEL } from "./client";
import type { HistorySource } from "./search";

export async function answerFromHistory(question: string, sources: HistorySource[]): Promise<string> {
  if (sources.length === 0) {
    return "No related history found for this asset.";
  }

  const openai = getOpenAI();
  const context = sources
    .map((s, i) => {
      const label = s.kind === "issue_history" ? "Resolved issue" : "Maintenance record";
      return `[${i + 1}] ${label} — Asset ${s.assetId}, WO ${s.woNumber ?? "none on file"}, ${s.date.toISOString().slice(0, 10)}
Description: ${s.description}
${s.rootCause ? `Root cause: ${s.rootCause}\n` : ""}Failure mode: ${s.failureMode ?? "not classified"}
Component: ${s.component ?? "not classified"}`;
    })
    .join("\n\n");

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a maintenance history assistant for a university utilities and energy services team. Answer the technician's question using ONLY the numbered records provided below — never use outside knowledge about the equipment. Every factual claim must cite its source record's WO number in parentheses, e.g. (WO-116200). If none of the provided records are actually relevant to the question, say so plainly instead of guessing or stretching a weak match.",
      },
      {
        role: "user",
        content: `Records:\n\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return res.choices[0]?.message?.content?.trim() || "The model did not return an answer.";
}
