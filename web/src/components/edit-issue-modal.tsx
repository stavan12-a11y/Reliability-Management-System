"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions, ConfirmDialog } from "./ui";
import { fieldInputStyle, fieldLabelStyle, colors } from "@/lib/theme";
import { fullEditIssue, deleteIssue } from "@/lib/actions/issues";

type IssueForEdit = {
  id: string;
  description: string;
  nextStep: string;
  responsible: string;
  partsEta: string | Date | null;
  returnEta: string | Date | null;
  woNumber: string | null;
};

function toDateInput(v: string | Date | null) {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

export function EditIssueModal({ issue, onClose }: { issue: IssueForEdit; onClose: () => void }) {
  const [form, setForm] = useState({
    description: issue.description,
    nextStep: issue.nextStep,
    responsible: issue.responsible,
    partsEta: toDateInput(issue.partsEta),
    returnEta: toDateInput(issue.returnEta),
    woNumber: issue.woNumber || "",
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await fullEditIssue(issue.id, {
          description: form.description,
          nextStep: form.nextStep,
          responsible: form.responsible,
          partsEta: form.partsEta || null,
          returnEta: form.returnEta || null,
          woNumber: form.woNumber || null,
        });
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteIssue(issue.id);
      onClose();
    });
  }

  return (
    <>
      <ModalShell onClose={onClose} title="Edit issue">
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabelStyle}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabelStyle}>Next step</label>
          <input value={form.nextStep} onChange={(e) => setForm((f) => ({ ...f, nextStep: e.target.value }))} style={fieldInputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabelStyle}>Responsible party</label>
            <input value={form.responsible} onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>AIM work order</label>
            <input value={form.woNumber} onChange={(e) => setForm((f) => ({ ...f, woNumber: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <div>
            <label style={fieldLabelStyle}>Parts ETA</label>
            <input type="date" value={form.partsEta} onChange={(e) => setForm((f) => ({ ...f, partsEta: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Return ETA</label>
            <input type="date" value={form.returnEta} onChange={(e) => setForm((f) => ({ ...f, returnEta: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: colors.danger, margin: "0 0 10px" }}>{error}</p>}
        <ModalActions onCancel={onClose} onSave={handleSave} saveLabel={pending ? "Saving…" : "Save changes"} disabled={pending} />
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.borderSubtle}`, textAlign: "center" }}>
          <span onClick={() => setConfirmingDelete(true)} style={{ fontSize: 12, color: colors.danger, cursor: "pointer" }}>
            Delete this issue
          </span>
        </div>
      </ModalShell>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this issue?"
          message="This removes the issue entirely — it won't be logged in Issue History. Use Resolve instead if the issue is actually fixed."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
          pending={pending}
        />
      )}
    </>
  );
}
