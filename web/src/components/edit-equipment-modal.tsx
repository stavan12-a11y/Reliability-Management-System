"use client";

import { useState, useTransition } from "react";
import { ModalShell, ModalActions, ConfirmDialog } from "./ui";
import { fieldInputStyle, fieldLabelStyle, colors } from "@/lib/theme";
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabelStyle}>Asset number</label>
            <input value={form.assetNumber} onChange={(e) => setForm((f) => ({ ...f, assetNumber: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Serial number</label>
            <input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabelStyle}>Manufacturer</label>
            <input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Model</label>
            <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: colors.textGhost, margin: "14px 0 8px", fontWeight: 500 }}>Nameplate data</p>
        {Object.entries(form.nameplate).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={fieldLabelStyle}>{key}</label>
            <input value={val} onChange={(e) => setNameplateField(key, e.target.value)} style={fieldInputStyle} />
          </div>
        ))}
        <p style={{ fontSize: 11.5, color: "#5a6272", margin: "4px 0 16px" }}>Use this when a component is replaced (e.g. new motor, new serial) so the asset record stays current.</p>
        {error && <p style={{ fontSize: 12, color: colors.danger, margin: "0 0 10px" }}>{error}</p>}
        <ModalActions onCancel={onClose} onSave={handleSave} saveLabel={pending ? "Saving…" : "Save changes"} disabled={pending} />
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.borderSubtle}`, textAlign: "center" }}>
          <span onClick={() => setConfirmingDelete(true)} style={{ fontSize: 12, color: colors.danger, cursor: "pointer" }}>
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
