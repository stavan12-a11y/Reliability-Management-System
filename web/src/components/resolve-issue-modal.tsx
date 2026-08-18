"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions } from "./ui";
import { fieldInputStyle, fieldLabelStyle, colors } from "@/lib/theme";
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
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setResolveType("full")} style={{ flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12.5, cursor: "pointer", fontWeight: 500, background: resolveType === "full" ? colors.okBg : colors.bgCard, border: resolveType === "full" ? `1px solid ${colors.ok}` : `1px solid ${colors.border}`, color: resolveType === "full" ? colors.ok : colors.textFaint }}>
            Fully resolved
          </button>
          <button onClick={() => setResolveType("downgrade")} style={{ flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12.5, cursor: "pointer", fontWeight: 500, background: resolveType === "downgrade" ? colors.warnBg : colors.bgCard, border: resolveType === "downgrade" ? `1px solid ${colors.warn}` : `1px solid ${colors.border}`, color: resolveType === "downgrade" ? colors.warn : colors.textFaint }}>
            Downgrade to limited
          </button>
        </div>
      )}

      {resolveType === "full" ? (
        <>
          <p style={{ fontSize: 11.5, color: colors.textGhost, margin: "0 0 14px" }}>Asset returns to Available. This moves the issue to Issue History.</p>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>What was done</label>
            <textarea value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="e.g. Replaced compressor bearing and recharged refrigerant" rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>Root cause</label>
            <input value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="e.g. Bearing wear from lubrication gap" style={fieldInputStyle} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={fieldLabelStyle}>Resolved date</label>
            <input type="date" value={resolvedDate} onChange={(e) => setResolvedDate(e.target.value)} style={fieldInputStyle} />
          </div>
          <p style={{ fontSize: 11.5, color: colors.textGhost, margin: "0 0 18px" }}>
            Downtime: <span style={{ color: colors.textMuted, fontWeight: 600 }}>{previewDays} day{previewDays !== 1 ? "s" : ""}</span> — calculated from identified date to resolved date.
          </p>
          {error && <p style={{ fontSize: 12, color: colors.danger, margin: "0 0 10px" }}>{error}</p>}
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Saving…" : "Mark resolved"} disabled={!canSubmitFull || pending} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 11.5, color: colors.textGhost, margin: "0 0 14px" }}>Asset moves to Limited but stays running. The issue stays active.</p>
          <div style={{ marginBottom: 18 }}>
            <label style={fieldLabelStyle}>What changed</label>
            <textarea value={downgradeNote} onChange={(e) => setDowngradeNote(e.target.value)} placeholder="e.g. Temporary repair holding, running at reduced capacity" rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          {error && <p style={{ fontSize: 12, color: colors.danger, margin: "0 0 10px" }}>{error}</p>}
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Saving…" : "Downgrade to limited"} disabled={!canSubmitDowngrade || pending} />
        </>
      )}
    </ModalShell>
  );
}
