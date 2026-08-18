"use client";

import { useRouter } from "next/navigation";
import { KpiRow, MetricCard, SectionHeader, StatusBadge } from "@/components/ui";
import { availabilityColor, colors, statusMeta } from "@/lib/theme";
import { systemIcon } from "@/lib/system-icons";
import type { getLocations, getSystemsByLocation } from "@/lib/data/locations";
import type { getEquipmentByLocation } from "@/lib/data/equipment";
import type { getActiveIssuesByLocation } from "@/lib/data/issues";

type Location = Awaited<ReturnType<typeof getLocations>>[number];
type System = Awaited<ReturnType<typeof getSystemsByLocation>>[number];
type Equipment = Awaited<ReturnType<typeof getEquipmentByLocation>>[number];
type Issue = Awaited<ReturnType<typeof getActiveIssuesByLocation>>[number];

export function LocationsContent({
  locations,
  selected,
  systems,
  equipment,
  issues,
  locStats,
  counts,
}: {
  locations: Location[];
  selected: string;
  systems: System[];
  equipment: Equipment[];
  issues: Issue[];
  locStats: { availabilityPct: number; criticalAvailabilityPct: number; mttrDays: number | null };
  counts: { available: number; limited: number; unavailable: number };
}) {
  const router = useRouter();

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {locations.map((l) => (
          <button
            key={l.id}
            onClick={() => router.push(`/locations?loc=${l.id}`)}
            style={{ padding: "7px 14px", borderRadius: 7, fontSize: 13.5, cursor: "pointer", background: selected === l.id ? colors.accentBg : colors.bgCard, color: selected === l.id ? colors.accent : colors.textDim, border: selected === l.id ? `1px solid ${colors.accentBorder}` : `1px solid ${colors.border}` }}
          >
            {l.name}
          </button>
        ))}
      </div>

      <KpiRow
        kpis={[
          { label: "Availability (90d)", value: `${locStats.availabilityPct}%`, color: availabilityColor(locStats.availabilityPct), detail: "This plant" },
          { label: "Critical availability", value: `${locStats.criticalAvailabilityPct}%`, color: availabilityColor(locStats.criticalAvailabilityPct), detail: "Critical-tier only" },
          { label: "Avg. repair time", value: locStats.mttrDays != null ? `${locStats.mttrDays}d` : "—", detail: "MTTR, this plant" },
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Available" value={counts.available} tone="neutral" />
        <MetricCard label="Limited" value={counts.limited} tone="limited" />
        <MetricCard label="Unavailable" value={counts.unavailable} tone="unavailable" />
      </div>

      <SectionHeader title="Active issues at this location" />
      <div style={{ marginBottom: 32 }}>
        {issues.length === 0 && <p style={{ fontSize: 13.5, color: colors.textGhost }}>No active issues at this location.</p>}
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => router.push(`/equipment/${issue.assetId}`)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 4px", borderBottom: `1px solid ${colors.borderSubtle}`, gap: 12 }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: colors.text }}>{issue.assetId}</span>
                {issue.overdue && <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.danger, letterSpacing: 0.3 }}>OVERDUE</span>}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: colors.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.description}</p>
            </div>
            <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
          </div>
        ))}
      </div>

      <SectionHeader title="Systems" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {systems.map((sys) => {
          const sysEq = equipment.filter((e) => e.systemId === sys.id);
          const Icon = systemIcon(sys.icon);
          return (
            <div key={sys.id} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon size={16} color={colors.accent} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>{sys.name}</p>
                <span style={{ fontSize: 12, color: colors.textGhost }}>{sysEq.length} assets</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sysEq.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => router.push(`/equipment/${e.id}`)}
                    style={{ cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "5px 10px", borderRadius: 6, background: statusMeta[e.status].bg, color: statusMeta[e.status].color, border: `1px solid ${statusMeta[e.status].color}33` }}
                  >
                    {e.id}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
