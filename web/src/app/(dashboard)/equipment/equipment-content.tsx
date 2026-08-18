"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Plus, Box, Percent, Clock, AlertTriangle } from "lucide-react";
import { EmptyState, ExportButton, StatusBadge, KpiCard, KpiGrid, SectionHeader, ParetoChart, downloadCsv } from "@/components/ui";
import { AddEquipmentModal } from "@/components/add-equipment-modal";
import { criticalityTier } from "@/lib/theme";
import type { getEquipmentList } from "@/lib/data/equipment";
import type { getActiveIssues } from "@/lib/data/issues";
import type { getIssueHistory } from "@/lib/data/history";

type Equipment = Awaited<ReturnType<typeof getEquipmentList>>[number];
type ActiveIssue = Awaited<ReturnType<typeof getActiveIssues>>[number];
type HistoryRow = Awaited<ReturnType<typeof getIssueHistory>>[number];
type Location = { id: string; name: string };
type System = { id: string; locationId: string; name: string };

const ROW_COLS = "grid-cols-[100px_130px_1fr_120px_18px]";

function availabilityAccent(pct: number) {
  if (pct >= 97) return { accent: "text-emerald-600", iconBg: "bg-emerald-50" };
  if (pct >= 90) return { accent: "text-amber-600", iconBg: "bg-amber-50" };
  return { accent: "text-red-600", iconBg: "bg-red-50" };
}

export function EquipmentContent({
  equipment,
  locations,
  systems,
  activeIssues,
  history,
  canManage,
}: {
  equipment: Equipment[];
  locations: Location[];
  systems: System[];
  activeIssues: ActiveIssue[];
  history: HistoryRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [classTab, setClassTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const classes = useMemo(() => ["All", ...Array.from(new Set(equipment.map((e) => e.class)))], [equipment]);

  const inTab = useMemo(() => (classTab === "All" ? equipment : equipment.filter((e) => e.class === classTab)), [equipment, classTab]);

  const filtered = inTab.filter((e) => {
    if (statusFilter !== "All" && e.status !== statusFilter) return false;
    if (query && !e.id.toLowerCase().includes(query.toLowerCase()) && !e.assetNumber.toLowerCase().includes(query.toLowerCase()) && !e.manufacturer.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  // KPIs describe the whole tab (not narrowed by the search box/status
  // filter) so switching "Pumps" always shows fleet-wide pump stats.
  const tabKpis = useMemo(() => {
    const ids = new Set(inTab.map((e) => e.id));
    const totalDays = inTab.length * 90;
    const totalDowntime = inTab.reduce((s, e) => s + e.downtimeDays90d, 0);
    const availabilityPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;
    const relevantHistory = history.filter((h) => ids.has(h.assetId));
    const mttrDays = relevantHistory.length > 0 ? Math.round((relevantHistory.reduce((s, h) => s + h.downtimeDays, 0) / relevantHistory.length) * 10) / 10 : null;
    const mtbfDays = relevantHistory.length > 0 ? Math.round(((totalDays - totalDowntime) / relevantHistory.length) * 10) / 10 : null;
    const activeCount = activeIssues.filter((i) => ids.has(i.assetId)).length;
    const available = inTab.filter((e) => e.status === "available").length;
    const limited = inTab.filter((e) => e.status === "limited").length;
    const unavailable = inTab.filter((e) => e.status === "unavailable").length;
    return { availabilityPct, mttrDays, mtbfDays, activeCount, available, limited, unavailable };
  }, [inTab, history, activeIssues]);

  const avail = availabilityAccent(tabKpis.availabilityPct);

  // Failure-mode Pareto, scoped to the selected class — mixing classes
  // together (e.g. boiler burner faults next to chiller refrigerant leaks)
  // doesn't tell you anything actionable about either one, so this only
  // renders once a specific class tab is selected, never for "All".
  const classPareto = useMemo(() => {
    if (classTab === "All") return [];
    const ids = new Set(inTab.map((e) => e.id));
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      if (!ids.has(h.assetId) || !h.failureMode) return;
      const label = h.failureMode.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [classTab, inTab, history]);
  const classParetoTotal = classPareto.reduce((s, d) => s + d.count, 0);

  function exportCsv() {
    downloadCsv(
      `equipment-${classTab === "All" ? "register" : classTab.toLowerCase().replace(/\s+/g, "-")}.csv`,
      filtered as unknown as Record<string, unknown>[],
      [
        { label: "Asset ID", value: (r) => (r as Equipment).id },
        { label: "Asset number", value: (r) => (r as Equipment).assetNumber },
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
    <div className="space-y-4">
      {showAdd && <AddEquipmentModal onClose={() => setShowAdd(false)} locations={locations} systems={systems} />}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {classes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setClassTab(c)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2 text-sm font-semibold transition ${
              classTab === c ? "border-maroon-700 text-maroon-800" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {c === "All" ? "All equipment" : `${c}s`}
          </button>
        ))}
      </div>

      <KpiGrid>
        <KpiCard label="Assets" value={inTab.length} icon={Box} accent="text-slate-700" iconBg="bg-slate-100" hint={classTab === "All" ? "All equipment" : `${classTab}s, all locations`} />
        <KpiCard label="Availability (90d)" value={`${tabKpis.availabilityPct}%`} icon={Percent} accent={avail.accent} iconBg={avail.iconBg} />
        <KpiCard label="Avg. repair time" value={tabKpis.mttrDays != null ? `${tabKpis.mttrDays}d` : "—"} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" hint="MTTR" />
        <KpiCard label="Time between failures" value={tabKpis.mtbfDays != null ? `${tabKpis.mtbfDays}d` : "—"} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" hint="MTBF" />
        <KpiCard
          label="Active issues"
          value={tabKpis.activeCount}
          icon={AlertTriangle}
          accent={tabKpis.activeCount > 0 ? "text-red-600" : "text-emerald-600"}
          iconBg={tabKpis.activeCount > 0 ? "bg-red-50" : "bg-emerald-50"}
        />
        <KpiCard
          label="Unavailable"
          value={tabKpis.unavailable}
          icon={AlertTriangle}
          accent={tabKpis.unavailable > 0 ? "text-red-600" : "text-emerald-600"}
          iconBg={tabKpis.unavailable > 0 ? "bg-red-50" : "bg-emerald-50"}
        />
      </KpiGrid>

      {classTab !== "All" && classPareto.length > 0 && (
        <div>
          <SectionHeader title="Failure mode analysis" subtitle={`Pareto — ${classTab}s only, ranked with cumulative %`} />
          <div className="card p-4">
            <ParetoChart data={classPareto} />
            <p className="mt-2 text-center text-[11px] text-slate-400">
              {classPareto.length} failure mode{classPareto.length !== 1 ? "s" : ""} across {classParetoTotal} resolved issue{classParetoTotal !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3" style={{ minWidth: 220 }}>
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, number, or manufacturer" className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input h-9 w-auto py-0">
          <option>All</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <ExportButton onClick={exportCsv} label="Export" />
        {canManage && (
          <button type="button" onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add equipment
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matching equipment" detail="Try a different search term, status filter, or class tab." />
      ) : (
        <div className="card overflow-hidden">
          <div className={`grid gap-2.5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 ${ROW_COLS}`}>
            <span>Asset</span>
            <span>Location</span>
            <span></span>
            <span>Status</span>
            <span></span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <div key={e.id} onClick={() => router.push(`/equipment/${e.id}`)} className={`grid cursor-pointer items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 ${ROW_COLS}`}>
                <span className="font-mono text-sm font-semibold text-slate-900">{e.id}</span>
                <span className="truncate text-xs text-slate-500">{e.location.name}</span>
                <span className="truncate text-xs text-slate-400">
                  {e.manufacturer} {e.model}
                </span>
                <StatusBadge status={e.status} />
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
