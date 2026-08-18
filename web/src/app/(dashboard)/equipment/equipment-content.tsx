"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, StatusBadge, downloadCsv } from "@/components/ui";
import { useSort } from "@/lib/hooks/useSort";
import { colors, criticalityTier, selectStyle } from "@/lib/theme";
import type { getEquipmentList } from "@/lib/data/equipment";

type Equipment = Awaited<ReturnType<typeof getEquipmentList>>[number];

export function EquipmentContent({ equipment }: { equipment: Equipment[] }) {
  const router = useRouter();
  const [viewBy, setViewBy] = useState<"location" | "class">("location");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const { sortKey, sortDir, toggleSort, sortRows } = useSort<Equipment>(null);

  const classes = ["All", ...Array.from(new Set(equipment.map((e) => e.class)))];

  const filtered = equipment.filter((e) => {
    if (classFilter !== "All" && e.class !== classFilter) return false;
    if (statusFilter !== "All" && e.status !== statusFilter) return false;
    if (query && !e.id.toLowerCase().includes(query.toLowerCase()) && !e.assetNumber.toLowerCase().includes(query.toLowerCase()) && !e.manufacturer.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const accessor = (row: Equipment, key: string) => {
    if (key === "criticality") return row.critScore;
    if (key === "status") return row.status;
    return null;
  };
  const sortedFiltered = sortRows(filtered, accessor);

  const grouped = useMemo(() => {
    const map: Record<string, Equipment[]> = {};
    sortedFiltered.forEach((e) => {
      const key = viewBy === "location" ? e.location.name : e.class;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [sortedFiltered, viewBy]);

  function exportCsv() {
    downloadCsv(
      "equipment-register.csv",
      sortedFiltered as unknown as Record<string, unknown>[],
      [
        { label: "Asset ID", value: (r) => (r as Equipment).id },
        { label: "Class", value: (r) => (r as Equipment).class },
        { label: "Location", value: (r) => (r as Equipment).location.name },
        { label: "System", value: (r) => (r as Equipment).system.name },
        { label: "Manufacturer", value: (r) => (r as Equipment).manufacturer },
        { label: "Model", value: (r) => (r as Equipment).model },
        { label: "Serial", value: (r) => (r as Equipment).serial },
        { label: "Status", value: (r) => (r as Equipment).status },
        { label: "Criticality", value: (r) => criticalityTier((r as Equipment).critScore).label },
      ],
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 7, padding: "0 10px", height: 34, flex: "1 1 220px" }}>
          <Search size={14} color={colors.textGhost} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, number, or manufacturer" style={{ background: "transparent", border: "none", outline: "none", color: colors.text, fontSize: 13, width: "100%" }} />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={selectStyle}>
          {classes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option>All</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div style={{ display: "flex", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 7, padding: 2 }}>
          {(["location", "class"] as const).map((v) => (
            <button key={v} onClick={() => setViewBy(v)} style={{ padding: "6px 12px", fontSize: 12.5, borderRadius: 5, border: "none", cursor: "pointer", background: viewBy === v ? colors.border : "transparent", color: viewBy === v ? colors.text : colors.textFaint }}>
              By {v}
            </button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "90px 90px 1fr 90px 90px 15px", gap: 12, padding: "0 14px", marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: colors.textGhost }}>Asset</span>
        <span style={{ fontSize: 12.5, color: colors.textGhost }}>Class</span>
        <span></span>
        <SortableHeader label="Criticality" sortKey="criticality" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <span></span>
      </div>

      {sortedFiltered.length === 0 ? (
        <EmptyState icon={Search} title="No matching equipment" detail="Try a different search term or clear a filter." />
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: colors.textGhost, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>{group}</p>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
              {items.map((e, i) => (
                <div
                  key={e.id}
                  onClick={() => router.push(`/equipment/${e.id}`)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}`, background: colors.bgRow }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: colors.text, width: 90 }}>{e.id}</span>
                  <span style={{ fontSize: 12.5, color: colors.textFaint, width: 90 }}>{e.class}</span>
                  <span style={{ fontSize: 12.5, color: colors.textGhost, flex: 1 }}>{e.manufacturer} {e.model}</span>
                  <span style={{ fontSize: 12, color: criticalityTier(e.critScore).color, fontFamily: "'JetBrains Mono', monospace" }}>{criticalityTier(e.critScore).label}</span>
                  <StatusBadge status={e.status} />
                  <ChevronRight size={15} color={colors.textGhostDark} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
