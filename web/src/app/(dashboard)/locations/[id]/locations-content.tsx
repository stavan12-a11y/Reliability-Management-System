"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Percent, ShieldAlert, Clock } from "lucide-react";
import { KpiCard, KpiGrid, SectionHeader, StatusBadge } from "@/components/ui";
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

const EQUIPMENT_STATUS_CLASSES = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  limited: "bg-amber-50 text-amber-700 ring-amber-600/20",
  unavailable: "bg-red-50 text-red-700 ring-red-600/20",
} as const;

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

      <div>
        <SectionHeader title="Active issues at this location" />
        {issues.length === 0 ? (
          <p className="text-sm text-slate-500">No active issues at this location.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.id} onClick={() => router.push(`/equipment/${issue.assetId}`)} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">{issue.assetId}</span>
                    {issue.overdue && <span className="text-[10px] font-bold tracking-wide text-red-600">OVERDUE</span>}
                  </div>
                  <p className="truncate text-sm text-slate-600">{issue.description}</p>
                </div>
                <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="Systems" />
        <div className="space-y-3">
          {systems.map((sys) => {
            const sysEq = equipment.filter((e) => e.systemId === sys.id);
            const Icon = systemIcon(sys.icon);
            return (
              <div key={sys.id} className="card p-4">
                <div className="mb-3 flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-maroon-700" />
                  <p className="text-sm font-bold text-slate-900">{sys.name}</p>
                  <span className="text-xs text-slate-400">{sysEq.length} assets</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sysEq.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => router.push(`/equipment/${e.id}`)}
                      className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold ring-1 ring-inset ${EQUIPMENT_STATUS_CLASSES[e.status]}`}
                    >
                      {e.id}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
