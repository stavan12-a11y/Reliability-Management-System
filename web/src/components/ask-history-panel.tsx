"use client";

import { useState, useTransition } from "react";
import { Sparkles, Send, FileText } from "lucide-react";
import { askAssetHistory, type AskHistoryResult } from "@/lib/actions/rag";

export function AskHistoryPanel({ assetId }: { assetId: string }) {
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [entries, setEntries] = useState<{ question: string; result: AskHistoryResult }[]>([]);

  function handleAsk() {
    const q = question.trim();
    if (!q || pending) return;
    startTransition(async () => {
      const result = await askAssetHistory(assetId, q);
      setEntries((h) => [{ question: q, result }, ...h]);
      setQuestion("");
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Ask a question about this asset&apos;s maintenance history. Answers are grounded in — and cite — this asset&apos;s actual past work orders, never general knowledge.</p>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="e.g. Has this chiller had bearing problems before?"
          className="input"
          disabled={pending}
        />
        <button type="button" onClick={handleAsk} disabled={pending || !question.trim()} className="btn-primary whitespace-nowrap">
          <Send className="h-4 w-4" /> {pending ? "Asking…" : "Ask"}
        </button>
      </div>

      {entries.length === 0 && (
        <div className="card flex items-center gap-3 p-4 text-sm text-slate-500">
          <Sparkles className="h-4 w-4 shrink-0 text-maroon-600" />
          Ask about failure patterns, past repairs, or recurring issues on this specific asset.
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="card p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">{entry.question}</p>
            {entry.result.error ? (
              <p className="text-sm text-red-600">{entry.result.error}</p>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{entry.result.answer}</p>
                {entry.result.sources.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sources</p>
                    {entry.result.sources.map((s) => (
                      <div key={s.id} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-700">
                            {s.woNumber ?? "No WO on file"} · {s.date}
                          </p>
                          <p className="text-slate-500">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
