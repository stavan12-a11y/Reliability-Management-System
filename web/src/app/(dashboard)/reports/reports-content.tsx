"use client";

import { Clock, AlertTriangle, RefreshCcw } from "lucide-react";
import { KpiCard, KpiGrid, SectionHeader } from "@/components/ui";

export function ReportsContent({
  byClass,
  totalDowntime,
  overdueCount,
  recurring,
}: {
  byClass: Record<string, { total: number; unavailable: number; limited: number }>;
  totalDowntime: number;
  overdueCount: number;
  recurring: [string, number][];
}) {
  return (
    <div className="space-y-6">
      <KpiGrid>
        <KpiCard label="Total recorded downtime" value={`${totalDowntime}d`} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" />
        <KpiCard label="Open issues overdue" value={overdueCount} icon={AlertTriangle} accent={overdueCount > 0 ? "text-red-600" : "text-emerald-600"} iconBg={overdueCount > 0 ? "bg-red-50" : "bg-emerald-50"} />
        <KpiCard label="Assets w/ recurring issues" value={recurring.length} icon={RefreshCcw} accent={recurring.length > 0 ? "text-amber-600" : "text-emerald-600"} iconBg={recurring.length > 0 ? "bg-amber-50" : "bg-emerald-50"} />
      </KpiGrid>

      <div>
        <SectionHeader title="Equipment class rollup" />
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_100px] gap-2.5 bg-slate-50 px-3.5 py-2 text-xs uppercase tracking-wide text-slate-400">
            <span>Class</span>
            <span>Total</span>
            <span>Unavailable</span>
            <span>Limited</span>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(byClass).map(([cls, d]) => (
              <div key={cls} className="grid grid-cols-[1fr_80px_100px_100px] gap-2.5 px-3.5 py-2.5">
                <span className="text-sm text-slate-700">{cls}</span>
                <span className="font-mono text-sm text-slate-500">{d.total}</span>
                <span className={`font-mono text-sm ${d.unavailable ? "text-red-600" : "text-slate-400"}`}>{d.unavailable}</span>
                <span className={`font-mono text-sm ${d.limited ? "text-amber-600" : "text-slate-400"}`}>{d.limited}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Recurring issues" subtitle="Assets with more than one historical issue" />
        {recurring.length === 0 ? (
          <p className="text-sm text-slate-500">No recurring issues on record.</p>
        ) : (
          <div className="space-y-2">
            {recurring.map(([assetId, count]) => (
              <div key={assetId} className="card flex justify-between px-3.5 py-2.5">
                <span className="font-mono text-sm font-semibold text-slate-900">{assetId}</span>
                <span className="text-xs text-slate-500">{count} recorded issues</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
