"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Percent, ShieldAlert, Clock, AlertTriangle, Wrench, Package } from "lucide-react";
import { KpiCard, KpiGrid, SectionHeader, EmptyState, StatusBadge } from "@/components/ui";
import type { getActiveIssues } from "@/lib/data/issues";

type Issue = Awaited<ReturnType<typeof getActiveIssues>>[number];

function availabilityAccent(pct: number) {
  if (pct >= 97) return { accent: "text-emerald-600", iconBg: "bg-emerald-50" };
  if (pct >= 90) return { accent: "text-amber-600", iconBg: "bg-amber-50" };
  return { accent: "text-red-600", iconBg: "bg-red-50" };
}

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
        <KpiCard
          label="Overdue next steps"
          value={counts.overdue}
          icon={Clock}
          accent={counts.overdue > 0 ? "text-red-600" : "text-emerald-600"}
          iconBg={counts.overdue > 0 ? "bg-red-50" : "bg-emerald-50"}
          onClick={() => router.push("/issues?tab=overdue")}
        />
        <KpiCard label="Awaiting parts" value={counts.awaitingParts} icon={Package} accent="text-slate-600" iconBg="bg-slate-100" onClick={() => router.push("/issues?tab=all")} />
      </KpiGrid>

      <div>
        <SectionHeader title="Active issues" subtitle="Sorted by urgency and criticality" />
        {issues.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All equipment available" detail="No active issues across UES right now." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.id} onClick={() => router.push(`/equipment/${issue.assetId}`)} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">{issue.assetId}</span>
                    <span className="text-xs text-slate-500">
                      {issue.asset.location.name} · {issue.asset.system.name}
                    </span>
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
    </div>
  );
}
