"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { createIssue, type CreateIssueState } from "@/lib/actions/issues";
import { criticalityTier } from "@/lib/theme";
import { CriticalityBadge } from "./ui";

type PickerAsset = { id: string; assetNumber: string; manufacturer: string; model: string; locationId: string; critScore: number };

export function LogIssueModal({ onClose, equipmentList, presetAssetId }: { onClose: () => void; equipmentList: PickerAsset[]; presetAssetId?: string | null }) {
  const [state, formAction, pending] = useActionState<CreateIssueState, FormData>(createIssue, undefined);
  const [assetId, setAssetId] = useState(presetAssetId || "");
  const [condition, setCondition] = useState<"unavailable" | "limited">("unavailable");
  const [query, setQuery] = useState("");

  const asset = equipmentList.find((e) => e.id === assetId);
  const tier = asset ? criticalityTier(asset.critScore) : null;
  const matches = query ? equipmentList.filter((e) => e.id.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden />
      <div onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-xl animate-fade-in rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Log new issue</h2>
          <button onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <input type="hidden" name="assetId" value={assetId} />

          <div className="relative mb-3.5">
            <span className="label">Asset</span>
            {asset ? (
              <div className="flex items-center justify-between rounded-lg border border-maroon-300 bg-maroon-50 px-3 py-2">
                <span className="text-sm text-slate-800">
                  <span className="font-mono font-semibold">{asset.id}</span> <span className="text-slate-500">· {asset.manufacturer} {asset.model}</span>
                </span>
                <X
                  className="h-3.5 w-3.5 cursor-pointer text-slate-400"
                  onClick={() => {
                    setAssetId("");
                    setQuery("");
                  }}
                />
              </div>
            ) : (
              <>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, e.g. CHLR003" className="input" />
                {matches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    {matches.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setAssetId(m.id);
                          setQuery("");
                        }}
                        className="cursor-pointer border-t border-slate-100 px-3 py-2 text-sm text-slate-700 first:border-t-0 hover:bg-slate-50"
                      >
                        <span className="font-mono font-semibold">{m.id}</span> <span className="text-slate-400">· {m.locationId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {asset && tier && (
            <div className="mb-3.5 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">Criticality (auto-filled from asset)</span>
              <CriticalityBadge tier={tier} />
            </div>
          )}

          <div className="mb-3.5">
            <span className="label">Condition</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCondition("unavailable")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${condition === "unavailable" ? "bg-red-100 text-red-700 ring-1 ring-red-600/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                Unavailable
              </button>
              <button
                type="button"
                onClick={() => setCondition("limited")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${condition === "limited" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-600/30" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                Limited
              </button>
            </div>
            <input type="hidden" name="condition" value={condition} />
            <p className="mt-1.5 text-xs text-slate-400">{condition === "unavailable" ? "Asset is fully down and out of service." : "Asset is still running, but degraded or constrained."}</p>
          </div>

          <label className="mb-3.5 block">
            <span className="label">Description</span>
            <textarea name="description" required placeholder="What's wrong, e.g. Low oil pressure on compressor bearing" rows={2} className="input resize-y" />
          </label>

          <div className="mb-3.5 grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="label">Responsible party</span>
              <input name="responsible" placeholder="Name" className="input" />
            </label>
            <label className="block">
              <span className="label">Return ETA (if known)</span>
              <input name="returnEta" type="date" className="input" />
            </label>
          </div>

          <label className="mb-3.5 block">
            <span className="label">Next step</span>
            <input name="nextStep" placeholder="e.g. Await replacement bearing from vendor" className="input" />
          </label>

          <label className="mb-2.5 block">
            <span className="label">AIM work order number (optional)</span>
            <input name="woNumber" placeholder="e.g. WO-118500 — add later if not cut yet" className="input" />
          </label>

          {state?.error && <p className="mb-2.5 text-xs text-red-600">{state.error}</p>}

          <div className="mt-2.5 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!assetId || pending} className="btn-primary flex-[2]">
              {pending ? "Logging…" : "Log issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
