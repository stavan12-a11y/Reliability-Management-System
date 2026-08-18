"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { createIssue, type CreateIssueState } from "@/lib/actions/issues";
import { colors, criticalityTier, fieldInputStyle, fieldLabelStyle } from "@/lib/theme";

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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: `1px solid ${colors.border}`, borderRadius: 14, width: "100%", maxWidth: 440, maxHeight: "90%", overflowY: "auto", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>Log new issue</h3>
          <X size={18} color={colors.textGhost} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <form action={formAction}>
          <input type="hidden" name="assetId" value={assetId} />

          <div style={{ marginBottom: 14, position: "relative" }}>
            <label style={fieldLabelStyle}>Asset</label>
            {asset ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.bgCard, border: `1px solid ${colors.accentBorder}`, borderRadius: 7, padding: "8px 10px" }}>
                <span style={{ fontSize: 13, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>
                  {asset.id} <span style={{ color: colors.textGhost, fontFamily: "inherit" }}>· {asset.manufacturer} {asset.model}</span>
                </span>
                <X size={14} color={colors.textGhost} style={{ cursor: "pointer" }} onClick={() => { setAssetId(""); setQuery(""); }} />
              </div>
            ) : (
              <>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, e.g. CHLR003" style={fieldInputStyle} />
                {matches.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 7, marginTop: 4, overflow: "hidden", zIndex: 10 }}>
                    {matches.map((m) => (
                      <div key={m.id} onClick={() => { setAssetId(m.id); setQuery(""); }} style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", color: colors.textMuted, borderTop: `1px solid ${colors.borderSubtle}` }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{m.id}</span> <span style={{ color: colors.textGhost }}>· {m.locationId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {asset && tier && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.bgCard, borderRadius: 7, padding: "8px 10px", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: colors.textFaint }}>Criticality (auto-filled from asset)</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.label}</span>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabelStyle}>Condition</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setCondition("unavailable")} style={{
                flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 500,
                background: condition === "unavailable" ? colors.dangerBg : colors.bgCard,
                border: condition === "unavailable" ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`,
                color: condition === "unavailable" ? colors.danger : colors.textFaint,
              }}>Unavailable</button>
              <button type="button" onClick={() => setCondition("limited")} style={{
                flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 500,
                background: condition === "limited" ? colors.warnBg : colors.bgCard,
                border: condition === "limited" ? `1px solid ${colors.warn}` : `1px solid ${colors.border}`,
                color: condition === "limited" ? colors.warn : colors.textFaint,
              }}>Limited</button>
            </div>
            <input type="hidden" name="condition" value={condition} />
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: colors.textGhost }}>
              {condition === "unavailable" ? "Asset is fully down and out of service." : "Asset is still running, but degraded or constrained."}
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabelStyle}>Description</label>
            <textarea name="description" required placeholder="What's wrong, e.g. Low oil pressure on compressor bearing" rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={fieldLabelStyle}>Responsible party</label>
              <input name="responsible" placeholder="Name" style={fieldInputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Return ETA (if known)</label>
              <input name="returnEta" type="date" style={fieldInputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabelStyle}>Next step</label>
            <input name="nextStep" placeholder="e.g. Await replacement bearing from vendor" style={fieldInputStyle} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={fieldLabelStyle}>AIM work order number (optional)</label>
            <input name="woNumber" placeholder="e.g. WO-118500 — add later if not cut yet" style={fieldInputStyle} />
          </div>

          {state?.error && <p style={{ margin: "0 0 10px", fontSize: 12.5, color: colors.danger }}>{state.error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={!assetId || pending} style={{
              flex: 2, padding: "10px 0", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600,
              cursor: !assetId || pending ? "not-allowed" : "pointer",
              background: !assetId || pending ? colors.border : colors.accent,
              color: !assetId || pending ? colors.textGhostDark : "#0a0d12",
            }}>{pending ? "Logging…" : "Log issue"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
