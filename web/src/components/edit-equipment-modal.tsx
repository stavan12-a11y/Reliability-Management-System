"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions, ConfirmDialog } from "./ui";
import { updateEquipment, deleteEquipment } from "@/lib/actions/equipment";

export function EditEquipmentModal({
  asset,
  onClose,
}: {
  asset: { id: string; assetNumber: string; manufacturer: string; model: string; serial: string; nameplate: Record<string, string> };
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    assetNumber: asset.assetNumber,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serial: asset.serial,
    nameplate: { ...asset.nameplate },
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setNameplateField(key: string, value: string) {
    setForm((f) => ({ ...f, nameplate: { ...f.nameplate, [key]: value } }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateEquipment(asset.id, form);
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEquipment(asset.id);
    });
  }

  return (
    <>
      <ModalShell onClose={onClose} title={`Edit ${asset.id}`}>
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="label">Asset number</span>
            <input value={form.assetNumber} onChange={(e) => setForm((f) => ({ ...f, assetNumber: e.target.value }))} className="input" />
          </label>
          <label className="block">
            <span className="label">Serial number</span>
            <input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} className="input" />
          </label>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="label">Manufacturer</span>
            <input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} className="input" />
          </label>
          <label className="block">
            <span className="label">Model</span>
            <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input" />
          </label>
        </div>
        <p className="mb-2 mt-3.5 text-xs font-semibold text-slate-500">Nameplate data</p>
        {Object.entries(form.nameplate).map(([key, val]) => (
          <label key={key} className="mb-2.5 block">
            <span className="label">{key}</span>
            <input value={val} onChange={(e) => setNameplateField(key, e.target.value)} className="input" />
          </label>
        ))}
        <p className="mb-4 mt-1 text-xs text-slate-400">Use this when a component is replaced (e.g. new motor, new serial) so the asset record stays current.</p>
        {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
        <ModalActions onCancel={onClose} onSave={handleSave} saveLabel={pending ? "Saving…" : "Save changes"} disabled={pending} />
        <div className="mt-3.5 border-t border-slate-100 pt-3.5 text-center">
          <span onClick={() => setConfirmingDelete(true)} className="cursor-pointer text-xs text-red-600 hover:underline">
            Delete this equipment record
          </span>
        </div>
      </ModalShell>
      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${asset.id}?`}
          message="This hides the asset from equipment lists. Its issue history and downtime records are preserved, not erased."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
          pending={pending}
        />
      )}
    </>
  );
}
