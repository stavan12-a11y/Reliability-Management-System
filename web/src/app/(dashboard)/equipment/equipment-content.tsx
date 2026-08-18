"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Plus } from "lucide-react";
import { EmptyState, ExportButton, SortableHeader, StatusBadge, CriticalityBadge, downloadCsv } from "@/components/ui";
import { AddEquipmentModal } from "@/components/add-equipment-modal";
import { useSort } from "@/lib/hooks/useSort";
import { criticalityTier } from "@/lib/theme";
import type { getEquipmentList } from "@/lib/data/equipment";

type Equipment = Awaited<ReturnType<typeof getEquipmentList>>[number];
type Location = { id: string; name: string };
type System = { id: string; locationId: string; name: string };

const ROW_COLS_BY_LOCATION = "grid-cols-[100px_1fr_90px_110px_18px]";
const ROW_COLS_BY_CLASS = "grid-cols-[100px_130px_1fr_90px_110px_18px]";

export function EquipmentContent({
  equipment,
  locations,
  systems,
  canManage,
}: {
  equipment: Equipment[];
  locations: Location[];
  systems: System[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [viewBy, setViewBy] = useState<"location" | "class">("location");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
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

  // By location: group by location, then sub-group by class so pumps sit
  // with pumps, boilers with boilers, within each plant.
  const byLocation = useMemo(() => {
    const map = new Map<string, Map<string, Equipment[]>>();
    sortedFiltered.forEach((e) => {
      const locKey = e.location.name;
      if (!map.has(locKey)) map.set(locKey, new Map());
      const classMap = map.get(locKey)!;
      if (!classMap.has(e.class)) classMap.set(e.class, []);
      classMap.get(e.class)!.push(e);
    });
    return map;
  }, [sortedFiltered]);

  // By class: flat within each class, but show location per row since the
  // grouping no longer implies it.
  const byClass = useMemo(() => {
    const map = new Map<string, Equipment[]>();
    sortedFiltered.forEach((e) => {
      if (!map.has(e.class)) map.set(e.class, []);
      map.get(e.class)!.push(e);
    });
    return map;
  }, [sortedFiltered]);

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

  function EquipmentRow({ e, showLocation }: { e: Equipment; showLocation: boolean }) {
    return (
      <div key={e.id} onClick={() => router.push(`/equipment/${e.id}`)} className={`grid items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer ${showLocation ? ROW_COLS_BY_CLASS : ROW_COLS_BY_LOCATION}`}>
        <span className="font-mono text-sm font-semibold text-slate-900">{e.id}</span>
        {showLocation && <span className="truncate text-xs text-slate-500">{e.location.name}</span>}
        <span className="truncate text-xs text-slate-400">
          {e.manufacturer} {e.model}
        </span>
        <CriticalityBadge tier={criticalityTier(e.critScore)} />
        <StatusBadge status={e.status} />
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAdd && <AddEquipmentModal onClose={() => setShowAdd(false)} locations={locations} systems={systems} />}

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
        {canManage && (
          <button type="button" onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add equipment
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
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

      {sortedFiltered.length === 0 ? (
        <EmptyState icon={Search} title="No matching equipment" detail="Try a different search term or clear a filter." />
      ) : viewBy === "location" ? (
        Array.from(byLocation.entries()).map(([locName, classMap]) => (
          <div key={locName} className="card overflow-hidden">
            <p className="border-b border-slate-100 bg-slate-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{locName}</p>
            {Array.from(classMap.entries()).map(([className, items], classIdx) => (
              <div key={className} className={classIdx > 0 ? "border-t border-slate-100" : ""}>
                <div className={`grid gap-2.5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 ${ROW_COLS_BY_LOCATION}`}>
                  <span>{className}</span>
                  <span></span>
                  <SortableHeader label="Crit." sortKey="criticality" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((e) => (
                    <EquipmentRow key={e.id} e={e} showLocation={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        Array.from(byClass.entries()).map(([className, items]) => (
          <div key={className} className="card overflow-hidden">
            <p className="border-b border-slate-100 bg-slate-50 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{className}</p>
            <div className={`grid gap-2.5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 ${ROW_COLS_BY_CLASS}`}>
              <span>Asset</span>
              <span>Location</span>
              <span></span>
              <SortableHeader label="Crit." sortKey="criticality" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
              <span></span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((e) => (
                <EquipmentRow key={e.id} e={e} showLocation={true} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
