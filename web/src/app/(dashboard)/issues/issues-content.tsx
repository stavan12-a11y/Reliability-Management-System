"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, CheckCircle2 } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, StatusBadge, downloadCsv } from "@/components/ui";
import { ResolveIssueModal } from "@/components/resolve-issue-modal";
import { EditIssueModal } from "@/components/edit-issue-modal";
import { useSort } from "@/lib/hooks/useSort";
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
    <div className="space-y-4">
      {fullEditIssue && <EditIssueModal issue={fullEditIssue} onClose={() => setFullEditIssue(null)} />}
      {resolveIssue && <ResolveIssueModal issue={resolveIssue} onClose={() => setResolveIssue(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterTab === t.id ? "bg-maroon-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing in this view" detail="No issues match this filter right now." />
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[90px_1fr_120px_85px_90px_100px] gap-2 bg-slate-50 px-3.5 py-2 text-xs uppercase tracking-wide">
            <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span className="text-slate-400">Issue / next step</span>
            <SortableHeader label="Responsible" sortKey="responsible" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Return ETA" sortKey="returnEta" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Condition" sortKey="condition" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span></span>
          </div>
          <div className="divide-y divide-slate-100">
            {sorted.map((issue) => {
              const editing = editingId === issue.id;
              return (
                <div key={issue.id}>
                  <div
                    onClick={() => !editing && router.push(`/equipment/${issue.assetId}`)}
                    className={`grid grid-cols-[90px_1fr_120px_85px_90px_100px] items-center gap-2 px-3.5 py-3 ${editing ? "" : "cursor-pointer hover:bg-slate-50"}`}
                  >
                    <span className="font-mono text-sm font-semibold text-slate-900">{issue.assetId}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700">{issue.description}</p>
                      {editing ? (
                        <input value={draft.nextStep} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, nextStep: e.target.value }))} className="input h-6 py-0 text-xs" />
                      ) : (
                        <p className="truncate text-xs text-slate-400">{issue.nextStep}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{issue.responsible}</span>
                    {editing ? (
                      <input type="date" value={draft.returnEta} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, returnEta: e.target.value }))} className="input h-6 py-0 text-xs" />
                    ) : (
                      <span className={`text-xs ${issue.overdue ? "text-red-600" : "text-slate-500"}`}>{fmtDate(issue.returnEta) || "—"}</span>
                    )}
                    <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
                    <div className="flex justify-end gap-1">
                      {canQuickEdit &&
                        (editing ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit(issue.id);
                            }}
                            disabled={pending}
                            title="Save"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-maroon-100 text-maroon-700 hover:bg-maroon-200"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(issue);
                            }}
                            title="Quick update"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        ))}
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolveIssue(issue);
                          }}
                          title="Resolve"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-3.5 pb-2 text-[10.5px] text-slate-400">
                    Updated {new Date(issue.updatedAt).toLocaleString()}
                    {canManage && (
                      <>
                        {" "}
                        ·{" "}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullEditIssue(issue);
                          }}
                          className="cursor-pointer underline hover:text-slate-600"
                        >
                          full edit
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
