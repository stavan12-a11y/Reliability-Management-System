"use client";

import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, downloadCsv } from "@/components/ui";
import { useSort } from "@/lib/hooks/useSort";
import { colors } from "@/lib/theme";
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
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={History} title="No resolved issues yet" detail="Resolved issues will show up here with root cause and downtime." />
      ) : (
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 100px 90px 120px", gap: 10, padding: "9px 14px", background: colors.bgCard, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span style={{ color: colors.textGhost }}>Issue</span>
            <SortableHeader label="Resolved" sortKey="resolved" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Downtime" sortKey="downtime" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span style={{ color: colors.textGhost }}>Root cause</span>
          </div>
          {sorted.map((h, i) => (
            <div key={h.id} onClick={() => router.push(`/equipment/${h.assetId}`)} style={{ cursor: "pointer", display: "grid", gridTemplateColumns: "90px 1fr 100px 90px 120px", gap: 10, padding: "12px 14px", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}`, alignItems: "center", background: colors.bgRow }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: colors.text }}>{h.assetId}</span>
              <span style={{ fontSize: 13, color: colors.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.description}</span>
              <span style={{ fontSize: 12.5, color: colors.textDim }}>{fmtDate(h.resolvedAt)}</span>
              <span style={{ fontSize: 12.5, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{h.downtimeDays}d</span>
              <span style={{ fontSize: 12.5, color: colors.textDim }}>{h.rootCause}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
