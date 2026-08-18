"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { ModalShell, ModalActions } from "./ui";
import { uploadDocument } from "@/lib/actions/maintenance";

const DOC_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "certificate", label: "Certificate" },
  { value: "report", label: "Report" },
  { value: "photo", label: "Photo" },
];

// No external file storage is configured (no Blob/S3/R2 provider), so the
// file is stored as a data: URL directly in the Document.fileUrl column.
// Fine for the small spec sheets/photos a demo asset accumulates; capped
// here to keep the database from bloating on anything larger.
const MAX_BYTES = 5 * 1024 * 1024;

export function UploadDocumentModal({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("manual");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !!fileDataUrl;

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setFileError("File is too large — 5MB max.");
      setFileDataUrl(null);
      return;
    }
    setFileError(null);
    if (!name.trim()) setName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!canSubmit || !fileDataUrl) return;
    setError(null);
    startTransition(async () => {
      try {
        await uploadDocument({ assetId, name, type, fileUrl: fileDataUrl });
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <ModalShell onClose={onClose} title="Upload document">
      <label className="mb-3 block">
        <span className="label">File</span>
        <input type="file" onChange={handleFile} className="input" />
        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
      </label>
      <label className="mb-3 block">
        <span className="label">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Compressor manual" className="input" />
      </label>
      <label className="mb-3 block">
        <span className="label">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input">
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mb-4 text-[11px] text-slate-400">Stored directly in the database — no external file storage is configured. Keep it under 5MB.</p>
      {error && <p className="mb-2.5 text-xs text-red-600">{error}</p>}
      <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel={pending ? "Uploading…" : "Upload"} disabled={!canSubmit || pending} />
    </ModalShell>
  );
}
