"use client";

import { useState, useTransition } from "react";
import { Sparkles, Send, FileText, X } from "lucide-react";
import { askHistory, type AskHistoryResult } from "@/lib/actions/rag";

export function AiHistoryWidget() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [entries, setEntries] = useState<{ question: string; result: AskHistoryResult }[]>([]);

  function handleAsk() {
    const q = question.trim();
    if (!q || pending) return;
    startTransition(async () => {
      const result = await askHistory(q);
      setEntries((h) => [{ question: q, result }, ...h]);
      setQuestion("");
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-maroon-800 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">AI dashboard assistant</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {entries.length === 0 && (
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-maroon-600" />
                Ask about anything on the dashboard — current KPIs, nameplate specs, status, or past failure patterns and repairs. E.g. &quot;What&apos;s CHLR003&apos;s availability?&quot; or &quot;Has it had bearing problems before?&quot; Historical claims cite real work orders.
              </div>
            )}
            {entries.map((entry, i) => (
              <div key={i} className="card p-3">
                <p className="mb-1.5 text-xs font-semibold text-slate-900">{entry.question}</p>
                {entry.result.error ? (
                  <p className="text-xs text-red-600">{entry.result.error}</p>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{entry.result.answer}</p>
                    {entry.result.sources.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sources</p>
                        {entry.result.sources.map((s) => (
                          <div key={s.id} className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2 text-[11px]">
                            <FileText className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                            <div>
                              <p className="font-semibold text-slate-700">
                                {s.assetId} · {s.woNumber ?? "No WO on file"} · {s.date}
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

          <div className="flex gap-2 border-t border-slate-100 p-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask about any asset's KPIs, specs, or history…"
              className="input text-sm"
              disabled={pending}
              autoFocus
            />
            <button type="button" onClick={handleAsk} disabled={pending || !question.trim()} className="btn-primary px-3">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Ask AI about equipment KPIs, specs, or history"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-white shadow-xl transition hover:bg-maroon-800"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </div>
  );
}
