"use client";

import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, downloadCsv } from "@/components/ui";
import { useSort } from "@/lib/hooks/useSort";
import type { getIssueHistory } from "@/lib/data/history";

type HistoryRow = Awaited<ReturnType<typeof getIssueHistory>>[number];

function fmtDate(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function HistoryContent({ history }: { history: HistoryRow[] }) {
  const router = useRouter();
  const { sortKey, sortDir, toggleSort, sortRows } = useSort<HistoryRow>("resolved");

  const accessor = (row: HistoryRow, key: string) => {
    if (key === "downtime") return row.downtimeDays;
    if (key === "asset") return row.assetId;
    if (key === "resolved") return new Date(row.resolvedAt).getTime();
    return null;
  };
  const sorted = sortRows(history, accessor);

  function exportCsv() {
    downloadCsv("issue-history.csv", sorted as unknown as Record<string, unknown>[], [
      { label: "Asset", value: (r) => (r as HistoryRow).assetId },
      { label: "Description", value: (r) => (r as HistoryRow).description },
      { label: "Resolved", value: (r) => fmtDate((r as HistoryRow).resolvedAt) },
      { label: "Downtime (days)", value: (r) => (r as HistoryRow).downtimeDays },
      { label: "Root cause", value: (r) => (r as HistoryRow).rootCause },
      { label: "AIM WO", value: (r) => (r as HistoryRow).woNumber },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={History} title="No resolved issues yet" detail="Resolved issues will show up here with root cause and downtime." />
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[90px_1fr_100px_90px_120px] gap-2.5 bg-slate-50 px-3.5 py-2 text-xs uppercase tracking-wide">
            <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span className="text-slate-400">Issue</span>
            <SortableHeader label="Resolved" sortKey="resolved" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Downtime" sortKey="downtime" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span className="text-slate-400">Root cause</span>
          </div>
          <div className="divide-y divide-slate-100">
            {sorted.map((h) => (
              <div key={h.id} onClick={() => router.push(`/equipment/${h.assetId}`)} className="grid cursor-pointer grid-cols-[90px_1fr_100px_90px_120px] items-center gap-2.5 px-3.5 py-3 hover:bg-slate-50">
                <span className="font-mono text-sm font-semibold text-slate-900">{h.assetId}</span>
                <span className="truncate text-sm text-slate-700">{h.description}</span>
                <span className="text-xs text-slate-500">{fmtDate(h.resolvedAt)}</span>
                <span className="font-mono text-xs text-slate-500">{h.downtimeDays}d</span>
                <span className="text-xs text-slate-500">{h.rootCause}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
