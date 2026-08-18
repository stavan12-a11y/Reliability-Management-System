"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions } from "./ui";
import { daysBetween } from "@/lib/data/kpis";
import { resolveIssueFull, downgradeIssue } from "@/lib/actions/issues";

export function ResolveIssueModal({
  issue,
  onClose,
}: {
  issue: { id: string; assetId: string; condition: "unavailable" | "limited"; identifiedAt: string | Date };
  onClose: () => void;
}) {
  const [resolveType, setResolveType] = useState<"full" | "downgrade">("full");
  const [workDone, setWorkDone] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolvedDate, setResolvedDate] = useState(new Date().toISOString().slice(0, 10));
  const [downgradeNote, setDowngradeNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canDowngrade = issue.condition === "unavailable";
  const canSubmitFull = workDone.trim().length > 0 && rootCause.trim().length > 0;
  const canSubmitDowngrade = downgradeNote.trim().length > 0;
  const previewDays = daysBetween(issue.identifiedAt, resolvedDate);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        if (resolveType === "full") {
          if (!canSubmitFull) return;
          await resolveIssueFull(issue.id, { workDone, rootCause, resolvedDate });
        } else {
          if (!canSubmitDowngrade) return;
          await downgradeIssue(issue.id, { note: downgradeNote });
        }
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <ModalShell onClose={onClose} title={`Resolve issue — ${issue.assetId}`}>
      {canDowngrade && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResolveType("full")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${resolveType === "full" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            Fully resolved
          </button>
          <button
            type="button"
            onClick={() => setResolveType("downgrade")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${resolveType === "downgrade" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-600/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            Downgrade to limited
          </button>
        </div>
      )}

      {resolveType === "full" ? (
        <>
          <p className="mb-3.5 text-xs text-slate-500">Asset returns to Available. This moves the issue to Issue History.</p>
          <label className="mb-3 block">
            <span className="label">What was done</span>
            <textarea value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="e.g. Replaced compressor bearing and recharged refrigerant" rows={2} className="input resize-y" />
          </label>
          <label className="mb-3 block">
            <span className="label">Root cause</span>
            <input value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="e.g. Bearing wear from lubrication gap" className="input" />
          </label>
          <label className="mb-2 block">
            <span className="label">Resolved date</span>
            <input type="date" value={resolvedDate} onChange={(e) => setResolvedDate(e.target.value)} className="input" />
          </label>
          <p className="mb-4 text-xs text-slate-500">
            Downtime: <span className="font-semibold text-slate-800">{previewDays} day{previewDays !== 1 ? "s" : ""}</span> — calculated from identified date to resolved date.
          </p>
          {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Saving…" : "Mark resolved"} disabled={!canSubmitFull || pending} />
        </>
      ) : (
        <>
          <p className="mb-3.5 text-xs text-slate-500">Asset moves to Limited but stays running. The issue stays active.</p>
          <label className="mb-4 block">
            <span className="label">What changed</span>
            <textarea value={downgradeNote} onChange={(e) => setDowngradeNote(e.target.value)} placeholder="e.g. Temporary repair holding, running at reduced capacity" rows={2} className="input resize-y" />
          </label>
          {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Saving…" : "Downgrade to limited"} disabled={!canSubmitDowngrade || pending} />
        </>
      )}
    </ModalShell>
  );
}
