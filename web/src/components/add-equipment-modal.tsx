"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalShell, ModalActions } from "./ui";
import { createEquipment } from "@/lib/actions/equipment";

type Location = { id: string; name: string };
type System = { id: string; locationId: string; name: string };

const EQUIPMENT_CLASSES = ["Chiller", "Boiler", "Pump", "Heat converter"];

export function AddEquipmentModal({ onClose, locations, systems }: { onClose: () => void; locations: Location[]; systems: System[] }) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    const defaultLocationId = locations[0]?.id ?? "";
    const defaultSystemId = systems.find((s) => s.locationId === defaultLocationId)?.id ?? "";
    return {
      id: "",
      assetNumber: "",
      locationId: defaultLocationId,
      systemId: defaultSystemId,
      class: EQUIPMENT_CLASSES[0],
      manufacturer: "",
      model: "",
      serial: "",
      critLikelihood: "3",
      critConsequence: "3",
    };
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const systemsForLocation = systems.filter((s) => s.locationId === form.locationId);
  const canSubmit = form.id.trim() && form.assetNumber.trim() && form.locationId && form.systemId && form.manufacturer.trim() && form.model.trim() && form.serial.trim();

  function handleLocationChange(locationId: string) {
    const firstSystem = systems.find((s) => s.locationId === locationId);
    setForm((f) => ({ ...f, locationId, systemId: firstSystem?.id ?? "" }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await createEquipment({
          id: form.id.trim(),
          assetNumber: form.assetNumber.trim(),
          locationId: form.locationId,
          systemId: form.systemId,
          class: form.class,
          manufacturer: form.manufacturer.trim(),
          model: form.model.trim(),
          serial: form.serial.trim(),
          critLikelihood: Number(form.critLikelihood),
          critConsequence: Number(form.critConsequence),
        });
        onClose();
        router.push(`/equipment/${form.id.trim()}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <ModalShell onClose={onClose} title="Add equipment">
      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="label">Asset ID</span>
          <input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toUpperCase() }))} placeholder="e.g. CHLR004" className="input" />
        </label>
        <label className="block">
          <span className="label">Asset number</span>
          <input value={form.assetNumber} onChange={(e) => setForm((f) => ({ ...f, assetNumber: e.target.value }))} placeholder="e.g. AST-10099" className="input" />
        </label>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="label">Location</span>
          <select value={form.locationId} onChange={(e) => handleLocationChange(e.target.value)} className="input">
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">System</span>
          <select value={form.systemId} onChange={(e) => setForm((f) => ({ ...f, systemId: e.target.value }))} className="input">
            {systemsForLocation.length === 0 && <option value="">No systems at this location</option>}
            {systemsForLocation.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mb-3 block">
        <span className="label">Class</span>
        <select value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} className="input">
          {EQUIPMENT_CLASSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

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

      <label className="mb-3 block">
        <span className="label">Serial number</span>
        <input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} className="input" />
      </label>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="label">Criticality — likelihood (1–5)</span>
          <select value={form.critLikelihood} onChange={(e) => setForm((f) => ({ ...f, critLikelihood: e.target.value }))} className="input">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Criticality — consequence (1–5)</span>
          <select value={form.critConsequence} onChange={(e) => setForm((f) => ({ ...f, critConsequence: e.target.value }))} className="input">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 text-xs text-slate-400">Nameplate data (Tonnage, MAWP, etc.) can be filled in afterward from the asset&apos;s Edit dialog.</p>

      {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
      <ModalActions onCancel={onClose} onSave={handleSave} saveLabel={pending ? "Adding…" : "Add equipment"} disabled={!canSubmit || pending} />
    </ModalShell>
  );
}
