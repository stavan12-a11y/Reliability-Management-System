"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Percent, ShieldAlert, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { KpiCard, KpiGrid, SectionHeader, StatusBadge, CriticalityBadge, EmptyState } from "@/components/ui";
import { criticalityTier } from "@/lib/theme";
import { systemIcon } from "@/lib/system-icons";
import type { getLocations, getSystemsByLocation } from "@/lib/data/locations";
import type { getEquipmentByLocation } from "@/lib/data/equipment";
import type { getActiveIssuesByLocation } from "@/lib/data/issues";

type Location = Awaited<ReturnType<typeof getLocations>>[number];
type System = Awaited<ReturnType<typeof getSystemsByLocation>>[number];
type Equipment = Awaited<ReturnType<typeof getEquipmentByLocation>>[number];
type Issue = Awaited<ReturnType<typeof getActiveIssuesByLocation>>[number];

function availabilityAccent(pct: number) {
  if (pct >= 97) return { accent: "text-emerald-600", iconBg: "bg-emerald-50" };
  if (pct >= 90) return { accent: "text-amber-600", iconBg: "bg-amber-50" };
  return { accent: "text-red-600", iconBg: "bg-red-50" };
}

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
  const fleetAvail = availabilityAccent(locStats.availabilityPct);
  const criticalAvail = availabilityAccent(locStats.criticalAvailabilityPct);

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => router.push("/overview")} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3 w-3" /> Back to Overview
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        {locations.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => router.push(`/locations/${l.id}`)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selected === l.id ? "bg-maroon-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {l.name}
          </button>
        ))}
      </div>

      <KpiGrid>
        <KpiCard label="Availability (90d)" value={`${locStats.availabilityPct}%`} icon={Percent} accent={fleetAvail.accent} iconBg={fleetAvail.iconBg} hint="This plant" />
        <KpiCard label="Critical availability" value={`${locStats.criticalAvailabilityPct}%`} icon={ShieldAlert} accent={criticalAvail.accent} iconBg={criticalAvail.iconBg} hint="Critical-tier only" />
        <KpiCard label="Avg. repair time" value={locStats.mttrDays != null ? `${locStats.mttrDays}d` : "—"} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" hint="MTTR, this plant" />
        <KpiCard label="Available" value={counts.available} icon={ShieldAlert} accent="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard label="Limited" value={counts.limited} icon={ShieldAlert} accent={counts.limited > 0 ? "text-amber-600" : "text-emerald-600"} iconBg={counts.limited > 0 ? "bg-amber-50" : "bg-emerald-50"} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader title="Systems" />
          <div className="space-y-3">
            {systems.map((sys) => {
              const sysEq = equipment.filter((e) => e.systemId === sys.id);
              const Icon = systemIcon(sys.icon);
              return (
                <div key={sys.id} className="card overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-3.5 py-2.5">
                    <Icon className="h-4 w-4 text-maroon-700" />
                    <p className="text-sm font-bold text-slate-900">{sys.name}</p>
                    <span className="text-xs text-slate-400">
                      {sysEq.length} asset{sysEq.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {sysEq.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => router.push(`/equipment/${e.id}`)}
                        className="grid cursor-pointer grid-cols-[100px_100px_1fr_90px_110px_18px] items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50"
                      >
                        <span className="font-mono text-sm font-semibold text-slate-900">{e.id}</span>
                        <span className="truncate text-xs text-slate-500">{e.assetNumber}</span>
                        <span className="truncate text-xs text-slate-400">
                          {e.manufacturer} {e.model}
                        </span>
                        <CriticalityBadge tier={criticalityTier(e.critScore)} />
                        <StatusBadge status={e.status} />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionHeader title="Active issues" subtitle="At this location" />
          {issues.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All equipment available" detail="No active issues at this location." />
          ) : (
            <div className="card divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
              {issues.map((issue) => (
                <div key={issue.id} onClick={() => router.push(`/equipment/${issue.assetId}`)} className="cursor-pointer px-3.5 py-3 hover:bg-slate-50">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">{issue.assetId}</span>
                    <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
                  </div>
                  {issue.overdue && <span className="mb-0.5 inline-block text-[10px] font-bold tracking-wide text-red-600">OVERDUE</span>}
                  <p className="truncate text-xs text-slate-500">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
