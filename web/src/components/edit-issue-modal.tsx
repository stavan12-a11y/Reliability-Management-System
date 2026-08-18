"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions, ConfirmDialog } from "./ui";
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
        <label className="mb-3 block">
          <span className="label">Description</span>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input resize-y" />
        </label>
        <label className="mb-3 block">
          <span className="label">Next step</span>
          <input value={form.nextStep} onChange={(e) => setForm((f) => ({ ...f, nextStep: e.target.value }))} className="input" />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="label">Responsible party</span>
            <input value={form.responsible} onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))} className="input" />
          </label>
          <label className="block">
            <span className="label">AIM work order</span>
            <input value={form.woNumber} onChange={(e) => setForm((f) => ({ ...f, woNumber: e.target.value }))} className="input" />
          </label>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="label">Parts ETA</span>
            <input type="date" value={form.partsEta} onChange={(e) => setForm((f) => ({ ...f, partsEta: e.target.value }))} className="input" />
          </label>
          <label className="block">
            <span className="label">Return ETA</span>
            <input type="date" value={form.returnEta} onChange={(e) => setForm((f) => ({ ...f, returnEta: e.target.value }))} className="input" />
          </label>
        </div>
        {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
        <ModalActions onCancel={onClose} onSave={handleSave} saveLabel={pending ? "Saving…" : "Save changes"} disabled={pending} />
        <div className="mt-3.5 border-t border-slate-100 pt-3.5 text-center">
          <span onClick={() => setConfirmingDelete(true)} className="cursor-pointer text-xs text-red-600 hover:underline">
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
