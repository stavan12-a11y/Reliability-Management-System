"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, StatusBadge, CriticalityBadge, downloadCsv } from "@/components/ui";
import { useSort } from "@/lib/hooks/useSort";
import { criticalityTier } from "@/lib/theme";
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3" style={{ minWidth: 220 }}>
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, number, or manufacturer" className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input h-9 w-auto py-0">
          {classes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input h-9 w-auto py-0">
          <option>All</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div className="flex rounded-lg bg-slate-200/70 p-1">
          {(["location", "class"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewBy(v)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition ${viewBy === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              By {v}
            </button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export" />
      </div>

      <div className="grid grid-cols-[90px_90px_1fr_90px_90px_15px] gap-3 px-3 text-xs">
        <span className="text-slate-400">Asset</span>
        <span className="text-slate-400">Class</span>
        <span></span>
        <SortableHeader label="Criticality" sortKey="criticality" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <span></span>
      </div>

      {sortedFiltered.length === 0 ? (
        <EmptyState icon={Search} title="No matching equipment" detail="Try a different search term or clear a filter." />
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{group}</p>
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {items.map((e) => (
                <div key={e.id} onClick={() => router.push(`/equipment/${e.id}`)} className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50">
                  <span className="w-[90px] font-mono text-sm font-semibold text-slate-900">{e.id}</span>
                  <span className="w-[90px] text-xs text-slate-500">{e.class}</span>
                  <span className="flex-1 text-xs text-slate-400">
                    {e.manufacturer} {e.model}
                  </span>
                  <CriticalityBadge tier={criticalityTier(e.critScore)} />
                  <StatusBadge status={e.status} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
