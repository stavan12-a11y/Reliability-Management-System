"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { KpiRow, MetricCard, SectionHeader, EmptyState, StatusBadge } from "@/components/ui";
import { availabilityColor, colors } from "@/lib/theme";
import type { getActiveIssues } from "@/lib/data/issues";

type Issue = Awaited<ReturnType<typeof getActiveIssues>>[number];

export function OverviewContent({
  counts,
  fleetStats,
  issues,
  newSinceYesterday,
}: {
  counts: { unavailable: number; limited: number; overdue: number; awaitingParts: number };
  fleetStats: { availabilityPct: number; criticalAvailabilityPct: number; mttrDays: number | null };
  issues: Issue[];
  newSinceYesterday: number;
}) {
  const router = useRouter();
  const [showDigest, setShowDigest] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: colors.textGhost }}>
          Morning brief · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <button
          onClick={() => setShowDigest((s) => !s)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 30, borderRadius: 7, background: showDigest ? colors.accentBg : colors.bgCard, border: showDigest ? `1px solid ${colors.accentBorder}` : `1px solid ${colors.border}`, color: showDigest ? colors.accent : colors.textDim, fontSize: 12, cursor: "pointer" }}
        >
          <Bell size={12} /> Daily digest preview
        </button>
      </div>

      {showDigest && (
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.accentBorder}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 600, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.4 }}>Sent to reliability managers, 6:00 AM daily</p>
          <p style={{ margin: 0, fontSize: 13.5, color: colors.textMuted, lineHeight: 1.6 }}>
            {counts.unavailable} assets unavailable, {counts.limited} operating with limitations. {counts.overdue} issue{counts.overdue !== 1 ? "s" : ""} overdue on next steps. {newSinceYesterday} update{newSinceYesterday !== 1 ? "s" : ""} logged since yesterday. Open the dashboard for details.
          </p>
        </div>
      )}

      <KpiRow
        kpis={[
          { label: "Fleet availability (90d)", value: `${fleetStats.availabilityPct}%`, color: availabilityColor(fleetStats.availabilityPct), detail: "All UES equipment" },
          { label: "Critical asset availability", value: `${fleetStats.criticalAvailabilityPct}%`, color: availabilityColor(fleetStats.criticalAvailabilityPct), detail: "Critical-tier only" },
          { label: "Avg. repair time (MTTR)", value: fleetStats.mttrDays != null ? `${fleetStats.mttrDays}d` : "—", detail: "Per resolved issue" },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Unavailable" value={counts.unavailable} tone="unavailable" onClick={() => router.push("/issues?tab=unavailable")} zeroDetail="No equipment currently down" />
        <MetricCard label="Operating limited" value={counts.limited} tone="limited" onClick={() => router.push("/issues?tab=limited")} zeroDetail="Everything at full capacity" />
        <MetricCard label="Overdue next steps" value={counts.overdue} tone="unavailable" onClick={() => router.push("/issues?tab=overdue")} zeroDetail="Nothing behind schedule" />
        <MetricCard label="Awaiting parts" value={counts.awaitingParts} tone="neutral" onClick={() => router.push("/issues?tab=all")} zeroDetail="No open parts orders" />
      </div>

      <SectionHeader title="Active issues" subtitle="Sorted by urgency and criticality" />
      <div>
        {issues.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All equipment available" detail="No active issues across UES right now." />
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => router.push(`/equipment/${issue.assetId}`)}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 4px", borderBottom: `1px solid ${colors.borderSubtle}`, gap: 12 }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: colors.text }}>{issue.assetId}</span>
                  <span style={{ fontSize: 12.5, color: colors.textGhost }}>{issue.asset.location.name} · {issue.asset.system.name}</span>
                  {issue.overdue && <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.danger, letterSpacing: 0.3 }}>OVERDUE</span>}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.description}</p>
              </div>
              <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
