"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User, ExternalLink, Clock, Box, Search, Pencil } from "lucide-react";
import { StatusBadge, KpiRow, InfoCard, EmptyState } from "@/components/ui";
import { EditEquipmentModal } from "@/components/edit-equipment-modal";
import { EditIssueModal } from "@/components/edit-issue-modal";
import { ResolveIssueModal } from "@/components/resolve-issue-modal";
import { availabilityColor, colors, criticalityTier } from "@/lib/theme";
import { assetAvailabilityPct } from "@/lib/data/kpis";
import type { getEquipmentById } from "@/lib/data/equipment";
import type { getActiveIssueByAssetId } from "@/lib/data/issues";
import type { getIssueHistoryByAsset } from "@/lib/data/history";
import type { getMaintenanceLogByAsset, getDocumentsByAsset } from "@/lib/data/maintenance";
import type { Role } from "@/generated/prisma/enums";

type Asset = NonNullable<Awaited<ReturnType<typeof getEquipmentById>>>;
type ActiveIssue = Awaited<ReturnType<typeof getActiveIssueByAssetId>>;
type PastIssue = Awaited<ReturnType<typeof getIssueHistoryByAsset>>[number];
type Maintenance = Awaited<ReturnType<typeof getMaintenanceLogByAsset>>[number];
type Doc = Awaited<ReturnType<typeof getDocumentsByAsset>>[number];

const TABS = ["overview", "issues", "updates", "maintenance", "documents"] as const;

function fmtDate(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function EquipmentProfileContent({
  asset,
  activeIssue,
  pastIssues,
  maintenance,
  documents,
  role,
}: {
  asset: Asset;
  activeIssue: ActiveIssue;
  pastIssues: PastIssue[];
  maintenance: Maintenance[];
  documents: Doc[];
  role: Role;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [showEditEquipment, setShowEditEquipment] = useState(false);
  const [showEditIssue, setShowEditIssue] = useState(false);
  const [showResolve, setShowResolve] = useState(false);

  const canManage = role === "manager";
  const tier = criticalityTier(asset.critScore);
  const nameplate = (asset.nameplate as Record<string, string>) ?? {};
  const availPct = assetAvailabilityPct(asset.downtimeDays90d);

  return (
    <div>
      {showEditEquipment && canManage && (
        <EditEquipmentModal asset={{ id: asset.id, assetNumber: asset.assetNumber, manufacturer: asset.manufacturer, model: asset.model, serial: asset.serial, nameplate }} onClose={() => setShowEditEquipment(false)} />
      )}
      {showEditIssue && activeIssue && canManage && (
        <EditIssueModal
          issue={{ id: activeIssue.id, description: activeIssue.description, nextStep: activeIssue.nextStep, responsible: activeIssue.responsible, partsEta: activeIssue.partsEta, returnEta: activeIssue.returnEta, woNumber: activeIssue.woNumber }}
          onClose={() => setShowEditIssue(false)}
        />
      )}
      {showResolve && activeIssue && canManage && (
        <ResolveIssueModal issue={{ id: activeIssue.id, assetId: activeIssue.assetId, condition: activeIssue.condition, identifiedAt: activeIssue.identifiedAt }} onClose={() => setShowResolve(false)} />
      )}

      <div onClick={() => router.push("/equipment")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: colors.textGhost, cursor: "pointer", marginBottom: 14 }}>
        <span>{asset.location.name}</span>
        <ChevronRight size={12} />
        <span>{asset.system.name}</span>
        <ChevronRight size={12} />
        <span style={{ color: colors.textDim }}>{asset.id}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{asset.id}</h2>
          <p style={{ margin: 0, fontSize: 13, color: colors.textFaint }}>{asset.assetNumber} · {asset.manufacturer} {asset.model} · {asset.class}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={asset.status} />
          <span title="Based on likelihood and consequence of failure" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 4, background: colors.border, color: tier.color, fontWeight: 600 }}>
            {tier.label}
          </span>
          {canManage && (
            <button onClick={() => setShowEditEquipment(true)} title="Edit equipment details" style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: colors.textDim, fontSize: 12 }}>
              <Pencil size={11} /> Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${colors.border}`, marginBottom: 20, marginTop: 12, overflowX: "auto" }}>
        {TABS.map((t) => (
          <span key={t} onClick={() => setTab(t)} style={{ padding: "9px 13px", fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize", color: tab === t ? colors.accent : colors.textFaint, borderBottom: tab === t ? `2px solid ${colors.accent}` : "2px solid transparent" }}>
            {t}
          </span>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <KpiRow
            kpis={[
              { label: "Availability (90d)", value: `${availPct}%`, color: availabilityColor(availPct), detail: "This asset" },
              { label: "Downtime (90d)", value: `${asset.downtimeDays90d}d`, detail: `${pastIssues.length} resolved issue${pastIssues.length !== 1 ? "s" : ""}` },
              { label: "Avg. repair time", value: pastIssues.length > 0 ? `${Math.round((pastIssues.reduce((s, h) => s + h.downtimeDays, 0) / pastIssues.length) * 10) / 10}d` : "—", detail: "MTTR, this asset" },
            ]}
          />
          {activeIssue && (
            <div style={{ background: "#1a1310", border: "1px solid #3a2318", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f0997b" }}>Active issue</p>
                {canManage && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowEditIssue(true)} style={{ fontSize: 11.5, color: "#f0997b", background: "transparent", border: "1px solid #3a2318", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => setShowResolve(true)} style={{ fontSize: 11.5, color: colors.ok, background: colors.okBg, border: "1px solid #3a5a1a", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Resolve</button>
                  </div>
                )}
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: colors.text }}>{activeIssue.description}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: colors.textDim }}>Identified {fmtDate(activeIssue.identifiedAt)} · Expected return {activeIssue.returnEta ? fmtDate(activeIssue.returnEta) : "TBD"}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12.5, color: colors.textDim }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={13} />{activeIssue.responsible}</span>
                {activeIssue.woNumber && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ExternalLink size={13} />{activeIssue.woNumber}</span>}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#5a4234" }}>Last updated {new Date(activeIssue.updatedAt).toLocaleString()}</p>
            </div>
          )}
          <InfoCard title="Nameplate data" rows={{ "Asset number": asset.assetNumber, ...nameplate, Manufacturer: asset.manufacturer, Model: asset.model, "Serial number": asset.serial }} full />
        </div>
      )}

      {tab === "issues" && (
        <div>
          {activeIssue ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: colors.textGhost, textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Active</p>
                {canManage && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setShowEditIssue(true)} style={{ fontSize: 11.5, color: colors.textDim, background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => setShowResolve(true)} style={{ fontSize: 11.5, color: colors.ok, background: colors.okBg, border: "1px solid #3a5a1a", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Resolve</button>
                  </div>
                )}
              </div>
              <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, color: colors.text }}>{activeIssue.description}</p>
                  <StatusBadge status={activeIssue.condition === "unavailable" ? "unavailable" : "limited"} />
                </div>
                <table style={{ width: "100%", fontSize: 12.5 }}>
                  <tbody>
                    <tr><td style={{ color: colors.textGhost, padding: "3px 0" }}>Next step</td><td style={{ textAlign: "right", color: colors.textMuted }}>{activeIssue.nextStep}</td></tr>
                    <tr><td style={{ color: colors.textGhost, padding: "3px 0" }}>Responsible</td><td style={{ textAlign: "right", color: colors.textMuted }}>{activeIssue.responsible}</td></tr>
                    {activeIssue.partsEta && <tr><td style={{ color: colors.textGhost, padding: "3px 0" }}>Parts ETA</td><td style={{ textAlign: "right", color: colors.textMuted }}>{fmtDate(activeIssue.partsEta)}</td></tr>}
                    <tr><td style={{ color: colors.textGhost, padding: "3px 0" }}>Return ETA</td><td style={{ textAlign: "right", color: colors.textMuted }}>{activeIssue.returnEta ? fmtDate(activeIssue.returnEta) : "—"}</td></tr>
                    <tr><td style={{ color: colors.textGhost, padding: "3px 0" }}>Work order</td><td style={{ textAlign: "right", color: colors.accent }}>{activeIssue.woNumber || "—"}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: colors.textGhost, marginBottom: 20 }}>No active issue.</p>
          )}
          <p style={{ fontSize: 12.5, fontWeight: 600, color: colors.textGhost, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Past</p>
          {pastIssues.length === 0 && <p style={{ fontSize: 13.5, color: colors.textGhost }}>No prior issues on record.</p>}
          {pastIssues.map((h) => (
            <div key={h.id} style={{ padding: "10px 0", borderTop: `1px solid ${colors.borderSubtle}` }}>
              <p style={{ margin: "0 0 3px", fontSize: 13.5, color: colors.textMuted }}>{h.description}</p>
              <p style={{ margin: 0, fontSize: 12, color: colors.textGhost }}>
                Resolved {fmtDate(h.resolvedAt)} · {h.downtimeDays} day{h.downtimeDays !== 1 ? "s" : ""} downtime · Root cause: {h.rootCause} {h.woNumber && <>· <span style={{ color: colors.accent }}>{h.woNumber}</span></>}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "updates" && (
        <div>
          {activeIssue && activeIssue.notes.length > 0 ? (
            [...activeIssue.notes].reverse().map((n, i) => (
              <div key={n.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}` }}>
                <Clock size={14} color={colors.textGhost} style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13.5, color: colors.textMuted }}>{n.body}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13.5, color: colors.textGhost }}>No recent updates — updates appear here as an active issue progresses.</p>
          )}
        </div>
      )}

      {tab === "maintenance" && (
        <div>
          <p style={{ fontSize: 12.5, color: colors.textGhost, marginBottom: 14 }}>Major maintenance events on this asset. Work order detail lives in AIM.</p>
          {maintenance.length === 0 ? (
            <EmptyState icon={Box} title="No major maintenance on record" detail="Overhauls, replacements, and tests will appear here." />
          ) : (
            maintenance.map((m, i) => (
              <div key={m.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}` }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: colors.textGhost, width: 84, flexShrink: 0, paddingTop: 2 }}>{fmtDate(m.date)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent, padding: "1px 8px", borderRadius: 4, background: "rgba(124,196,240,0.1)", textTransform: "capitalize" }}>{m.type.replace("_", " ")}</span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 13.5, color: colors.textMuted }}>{m.description}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: colors.textGhost }}>{m.woNumber}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <p style={{ fontSize: 12.5, color: colors.textGhost, marginBottom: 14 }}>Datasheets, manuals, certificates, and photos for this asset.</p>
          {documents.length === 0 ? (
            <EmptyState icon={Search} title="No documents uploaded yet" detail="Manuals, certificates, and photos for this asset will appear here." />
          ) : (
            documents.map((d, i) => (
              <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}` }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13.5, color: colors.textMuted }}>{d.name}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: colors.textGhost, textTransform: "capitalize" }}>{d.type} · {fmtDate(d.uploadedAt)}</p>
                </div>
                <ExternalLink size={14} color={colors.textGhost} />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
