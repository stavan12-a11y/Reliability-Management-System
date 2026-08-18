"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Percent, ShieldAlert, Clock, AlertTriangle, Wrench, MapPin, ChevronRight } from "lucide-react";
import { KpiCard, KpiGrid, SectionHeader, EmptyState, StatusBadge, TrendLineChart } from "@/components/ui";
import type { getActiveIssues } from "@/lib/data/issues";
import type { getLocationSummaries } from "@/lib/data/locations";

type Issue = Awaited<ReturnType<typeof getActiveIssues>>[number];
type LocationSummary = Awaited<ReturnType<typeof getLocationSummaries>>[number];
type TrendPoint = { label: string; value: number };

function availabilityAccent(pct: number) {
  if (pct >= 97) return { accent: "text-emerald-600", iconBg: "bg-emerald-50" };
  if (pct >= 90) return { accent: "text-amber-600", iconBg: "bg-amber-50" };
  return { accent: "text-red-600", iconBg: "bg-red-50" };
}

export function OverviewContent({
  counts,
  fleetStats,
  trend,
  issues,
  newSinceYesterday,
  locations,
}: {
  counts: { unavailable: number; limited: number; overdue: number; awaitingParts: number };
  fleetStats: { availabilityPct: number; criticalAvailabilityPct: number; mttrDays: number | null; mtbfDays: number | null };
  trend: TrendPoint[];
  issues: Issue[];
  newSinceYesterday: number;
  locations: LocationSummary[];
}) {
  const router = useRouter();
  const [showDigest, setShowDigest] = useState(false);

  const fleetAvail = availabilityAccent(fleetStats.availabilityPct);
  const criticalAvail = availabilityAccent(fleetStats.criticalAvailabilityPct);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fleet Reliability Overview</h2>
          <p className="text-sm text-slate-500">Morning brief · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
        </div>
        <button type="button" onClick={() => setShowDigest((s) => !s)} className={showDigest ? "btn bg-maroon-100 text-maroon-800" : "btn-secondary"}>
          <Bell className="h-4 w-4" /> Daily digest preview
        </button>
      </div>

      {showDigest && (
        <div className="card border-maroon-200 bg-maroon-50 p-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-maroon-700">Sent to reliability managers, 6:00 AM daily</p>
          <p className="text-sm leading-relaxed text-slate-700">
            {counts.unavailable} assets unavailable, {counts.limited} operating with limitations. {counts.overdue} issue{counts.overdue !== 1 ? "s" : ""} overdue on next steps.{" "}
            {newSinceYesterday} update{newSinceYesterday !== 1 ? "s" : ""} logged since yesterday. Open the dashboard for details.
          </p>
        </div>
      )}

      <KpiGrid>
        <KpiCard label="Fleet availability (90d)" value={`${fleetStats.availabilityPct}%`} icon={Percent} accent={fleetAvail.accent} iconBg={fleetAvail.iconBg} hint="All UES equipment" />
        <KpiCard label="Critical asset availability" value={`${fleetStats.criticalAvailabilityPct}%`} icon={ShieldAlert} accent={criticalAvail.accent} iconBg={criticalAvail.iconBg} hint="Critical-tier only" />
        <KpiCard label="Avg. repair time (MTTR)" value={fleetStats.mttrDays != null ? `${fleetStats.mttrDays}d` : "—"} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" hint="Per resolved issue" />
        <KpiCard
          label="Unavailable"
          value={counts.unavailable}
          icon={AlertTriangle}
          accent={counts.unavailable > 0 ? "text-red-600" : "text-emerald-600"}
          iconBg={counts.unavailable > 0 ? "bg-red-50" : "bg-emerald-50"}
          onClick={() => router.push("/issues?tab=unavailable")}
        />
        <KpiCard
          label="Operating limited"
          value={counts.limited}
          icon={Wrench}
          accent={counts.limited > 0 ? "text-amber-600" : "text-emerald-600"}
          iconBg={counts.limited > 0 ? "bg-amber-50" : "bg-emerald-50"}
          onClick={() => router.push("/issues?tab=limited")}
        />
      </KpiGrid>

      <div className="card p-4">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Fleet availability trend</p>
            <p className="text-xs text-slate-500">Last 6 months, from resolved-issue downtime</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold leading-none text-slate-900">{fleetStats.mtbfDays != null ? `${fleetStats.mtbfDays}d` : "—"}</p>
            <p className="mt-1 text-[11px] text-slate-400">MTBF (90d) · avg. time between failures</p>
          </div>
        </div>
        <TrendLineChart data={trend} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader title="Locations" subtitle="Click a plant to see its equipment and KPIs" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => router.push(`/locations/${loc.id}`)}
                className="card flex flex-col gap-3 p-4 text-left transition-all hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-maroon-50">
                      <MapPin className="h-4 w-4 text-maroon-700" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{loc.name}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {loc.total} asset{loc.total !== 1 ? "s" : ""}
                  </span>
                  {loc.activeIssues > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                      {loc.activeIssues} active issue{loc.activeIssues !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      All normal
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>
                    <span className="font-semibold text-emerald-600">{loc.available}</span> available
                  </span>
                  <span>
                    <span className="font-semibold text-amber-600">{loc.limited}</span> limited
                  </span>
                  <span>
                    <span className="font-semibold text-red-600">{loc.unavailable}</span> unavailable
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionHeader title="Active issues" subtitle="By urgency" />
          {issues.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All equipment available" detail="No active issues right now." />
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
