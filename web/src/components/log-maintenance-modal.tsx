"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions } from "./ui";
import { logMaintenanceEntry } from "@/lib/actions/maintenance";
import { FAILURE_MODES, COMPONENTS } from "@/lib/rag/vocab";

const MAINTENANCE_TYPES = [
  { value: "overhaul", label: "Overhaul" },
  { value: "component_replacement", label: "Component replacement" },
  { value: "test", label: "Test" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
];

export function LogMaintenanceModal({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("inspection");
  const [description, setDescription] = useState("");
  const [woNumber, setWoNumber] = useState("");
  const [failureMode, setFailureMode] = useState("");
  const [component, setComponent] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = description.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await logMaintenanceEntry({ assetId, date, type, description, woNumber: woNumber || null, failureMode: failureMode || null, component: component || null });
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <ModalShell onClose={onClose} title="Log maintenance entry">
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="label">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="label">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {MAINTENANCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mb-3 block">
        <span className="label">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Annual overhaul, refractory inspection, burner tune"
          rows={2}
          className="input resize-y"
        />
      </label>
      <label className="mb-3 block">
        <span className="label">Work order number (optional)</span>
        <input value={woNumber} onChange={(e) => setWoNumber(e.target.value)} placeholder="WO-117200" className="input" />
      </label>
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="label">Failure mode (optional)</span>
          <select value={failureMode} onChange={(e) => setFailureMode(e.target.value)} className="input">
            <option value="">Not classified</option>
            {FAILURE_MODES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Component (optional)</span>
          <select value={component} onChange={(e) => setComponent(e.target.value)} className="input">
            <option value="">Not classified</option>
            {COMPONENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-4 text-[11px] text-slate-400">Classifying the failure feeds the fleet Pareto chart and the AI history lookup — worth a few seconds if you know it.</p>
      {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
      <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Saving…" : "Log entry"} disabled={!canSubmit || pending} />
    </ModalShell>
  );
}
