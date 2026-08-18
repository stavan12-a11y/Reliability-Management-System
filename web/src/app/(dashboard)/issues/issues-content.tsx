"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, CheckCircle2 } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, StatusBadge, downloadCsv } from "@/components/ui";
import { ResolveIssueModal } from "@/components/resolve-issue-modal";
import { EditIssueModal } from "@/components/edit-issue-modal";
import { useSort } from "@/lib/hooks/useSort";
import { colors } from "@/lib/theme";
import { quickUpdateIssue } from "@/lib/actions/issues";
import type { getActiveIssues } from "@/lib/data/issues";
import type { Role } from "@/generated/prisma/enums";

type Issue = Awaited<ReturnType<typeof getActiveIssues>>[number];

const TABS = [
  { id: "all", label: "All" },
  { id: "unavailable", label: "Unavailable" },
  { id: "limited", label: "Limited" },
  { id: "awaiting", label: "Awaiting parts" },
  { id: "overdue", label: "Overdue" },
] as const;

function fmtDate(d: string | Date | null) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

export function IssuesContent({ issues, initialTab, role }: { issues: Issue[]; initialTab: string; role: Role }) {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState(initialTab);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ nextStep: "", returnEta: "" });
  const [fullEditIssue, setFullEditIssue] = useState<Issue | null>(null);
  const [resolveIssue, setResolveIssue] = useState<Issue | null>(null);
  const [pending, startTransition] = useTransition();
  const { sortKey, sortDir, toggleSort, sortRows } = useSort<Issue>(null);

  const canQuickEdit = role === "technician" || role === "manager";
  const canManage = role === "manager";

  const filtered = issues.filter((i) => {
    if (filterTab === "all") return true;
    if (filterTab === "awaiting") return !!i.partsEta;
    if (filterTab === "overdue") return i.overdue;
    return i.condition === filterTab;
  });

  const accessor = (row: Issue, key: string) => {
    if (key === "asset") return row.assetId;
    if (key === "responsible") return row.responsible;
    if (key === "returnEta") return row.returnEta ? new Date(row.returnEta).getTime() : null;
    if (key === "condition") return row.condition;
    return null;
  };
  const sorted = sortRows(filtered, accessor);

  function startEdit(issue: Issue) {
    setEditingId(issue.id);
    setDraft({ nextStep: issue.nextStep, returnEta: fmtDate(issue.returnEta) || "" });
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      await quickUpdateIssue(id, { nextStep: draft.nextStep, returnEta: draft.returnEta || null });
      setEditingId(null);
    });
  }

  function exportCsv() {
    downloadCsv("active-issues.csv", sorted as unknown as Record<string, unknown>[], [
      { label: "Asset", value: (r) => (r as Issue).assetId },
      { label: "Location", value: (r) => (r as Issue).asset.location.name },
      { label: "Condition", value: (r) => (r as Issue).condition },
      { label: "Description", value: (r) => (r as Issue).description },
      { label: "Next step", value: (r) => (r as Issue).nextStep },
      { label: "Responsible", value: (r) => (r as Issue).responsible },
      { label: "Parts ETA", value: (r) => fmtDate((r as Issue).partsEta) },
      { label: "Return ETA", value: (r) => fmtDate((r as Issue).returnEta) },
      { label: "Overdue", value: (r) => ((r as Issue).overdue ? "Yes" : "No") },
      { label: "AIM WO", value: (r) => (r as Issue).woNumber },
    ]);
  }

  return (
    <div>
      {fullEditIssue && <EditIssueModal issue={fullEditIssue} onClose={() => setFullEditIssue(null)} />}
      {resolveIssue && <ResolveIssueModal issue={resolveIssue} onClose={() => setResolveIssue(null)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setFilterTab(t.id)} style={{ padding: "6px 13px", borderRadius: 7, fontSize: 13, cursor: "pointer", background: filterTab === t.id ? colors.border : "transparent", color: filterTab === t.id ? colors.text : colors.textFaint, border: filterTab === t.id ? "1px solid #3a4353" : `1px solid ${colors.border}` }}>
              {t.label}
            </button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing in this view" detail="No issues match this filter right now." />
      ) : (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px 85px 90px 100px", gap: 8, padding: "9px 14px", background: colors.bgCard, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span style={{ color: colors.textGhost }}>Issue / next step</span>
            <SortableHeader label="Responsible" sortKey="responsible" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Return ETA" sortKey="returnEta" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Condition" sortKey="condition" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span></span>
          </div>
          {sorted.map((issue, i) => {
            const editing = editingId === issue.id;
            return (
              <div key={issue.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}`, background: colors.bgRow }}>
                <div onClick={() => !editing && router.push(`/equipment/${issue.assetId}`)} style={{ cursor: editing ? "default" : "pointer", display: "grid", gridTemplateColumns: "90px 1fr 120px 85px 90px 100px", gap: 8, padding: "12px 14px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: colors.text }}>{issue.assetId}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.description}</p>
                    {editing ? (
                      <input value={draft.nextStep} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, nextStep: e.target.value }))} style={{ fontSize: 11.5, background: "#0a0d12", border: "1px solid #3a4353", borderRadius: 4, padding: "3px 6px", color: colors.text, width: "100%" }} />
                    ) : (
                      <p style={{ margin: 0, fontSize: 11.5, color: colors.textGhost, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.nextStep}</p>
                    )}
                  </div>
                  <span style={{ fontSize: 12.5, color: colors.textDim }}>{issue.responsible}</span>
                  {editing ? (
                    <input type="date" value={draft.returnEta} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, returnEta: e.target.value }))} style={{ fontSize: 12, background: "#0a0d12", border: "1px solid #3a4353", borderRadius: 4, padding: "3px 6px", color: colors.text, width: "100%" }} />
                  ) : (
                    <span style={{ fontSize: 12.5, color: issue.overdue ? colors.danger : colors.textDim }}>{fmtDate(issue.returnEta) || "—"}</span>
                  )}
                  <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    {canQuickEdit &&
                      (editing ? (
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(issue.id); }} disabled={pending} title="Save" style={{ background: colors.accentBg, border: `1px solid ${colors.accentBorder}`, borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Check size={13} color={colors.accent} />
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); startEdit(issue); }} title="Quick update" style={{ background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Pencil size={12} color={colors.textGhost} />
                        </button>
                      ))}
                    {canManage && (
                      <button onClick={(e) => { e.stopPropagation(); setResolveIssue(issue); }} title="Resolve" style={{ background: colors.okBg, border: "1px solid #3a5a1a", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <CheckCircle2 size={13} color={colors.ok} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ padding: "0 14px 9px", fontSize: 10.5, color: colors.textGhostDark }}>
                  Updated {new Date(issue.updatedAt).toLocaleString()}
                  {canManage && (
                    <>
                      {" "}
                      ·{" "}
                      <span onClick={(e) => { e.stopPropagation(); setFullEditIssue(issue); }} style={{ cursor: "pointer", color: "#5a6272", textDecoration: "underline" }}>
                        full edit
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
