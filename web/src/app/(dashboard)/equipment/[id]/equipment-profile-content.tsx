"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, User, ExternalLink, Clock, Box, Search, Pencil, Percent, Wrench } from "lucide-react";
import { StatusBadge, KpiCard, KpiGrid, InfoCard, EmptyState } from "@/components/ui";
import { EditEquipmentModal } from "@/components/edit-equipment-modal";
import { EditIssueModal } from "@/components/edit-issue-modal";
import { ResolveIssueModal } from "@/components/resolve-issue-modal";
import { criticalityTier } from "@/lib/theme";
import { assetAvailabilityPct } from "@/lib/data/kpis";
import type { getEquipmentById } from "@/lib/data/equipment";
import type { getActiveIssueByAssetId } from "@/lib/data/issues";
import type { getIssueHistoryByAsset } from "@/lib/data/history";
import type { getMaintenanceLogByAsset, getDocumentsByAsset } from "@/lib/data/maintenance";
import type { Role } from "@/generated/prisma/enums";

type Asset = NonNullable<Awaited<ReturnType<typeof getEquipmentById>>>;
type ActiveIssue = Awaited<ReturnType<typeof getActiveIssueByAssetId>>;
type PastIssue = Awaited<ReturnType<typeof getIssueHistoryByAsset>>[number];
type Maintenance = Awaited<ReturnType<typeof getMaintenanceLogByAsset>>[number];
type Doc = Awaited<ReturnType<typeof getDocumentsByAsset>>[number];

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "issues", label: "Issues" },
  { key: "updates", label: "Updates" },
  { key: "maintenance", label: "Maintenance" },
  { key: "documents", label: "Documents" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function fmtDate(d: string | Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function availabilityAccent(pct: number) {
  if (pct >= 97) return { accent: "text-emerald-600", iconBg: "bg-emerald-50" };
  if (pct >= 90) return { accent: "text-amber-600", iconBg: "bg-amber-50" };
  return { accent: "text-red-600", iconBg: "bg-red-50" };
}

export function EquipmentProfileContent({
  asset,
  activeIssue,
  pastIssues,
  maintenance,
  documents,
  role,
}: {
  asset: Asset;
  activeIssue: ActiveIssue;
  pastIssues: PastIssue[];
  maintenance: Maintenance[];
  documents: Doc[];
  role: Role;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [showEditEquipment, setShowEditEquipment] = useState(false);
  const [showEditIssue, setShowEditIssue] = useState(false);
  const [showResolve, setShowResolve] = useState(false);

  const canManage = role === "manager";
  const tier = criticalityTier(asset.critScore);
  const nameplate = (asset.nameplate as Record<string, string>) ?? {};
  const availPct = assetAvailabilityPct(asset.downtimeDays90d);
  const avail = availabilityAccent(availPct);

  return (
    <div>
      {showEditEquipment && canManage && (
        <EditEquipmentModal asset={{ id: asset.id, assetNumber: asset.assetNumber, manufacturer: asset.manufacturer, model: asset.model, serial: asset.serial, nameplate }} onClose={() => setShowEditEquipment(false)} />
      )}
      {showEditIssue && activeIssue && canManage && (
        <EditIssueModal
          issue={{ id: activeIssue.id, description: activeIssue.description, nextStep: activeIssue.nextStep, responsible: activeIssue.responsible, partsEta: activeIssue.partsEta, returnEta: activeIssue.returnEta, woNumber: activeIssue.woNumber }}
          onClose={() => setShowEditIssue(false)}
        />
      )}
      {showResolve && activeIssue && canManage && (
        <ResolveIssueModal issue={{ id: activeIssue.id, assetId: activeIssue.assetId, condition: activeIssue.condition, identifiedAt: activeIssue.identifiedAt }} onClose={() => setShowResolve(false)} />
      )}

      <div onClick={() => router.push("/equipment")} className="mb-3 flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
        <span>{asset.location.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span>{asset.system.name}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-slate-700">{asset.id}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-mono text-xl font-bold text-slate-900">{asset.id}</h2>
            <span className={`text-sm font-semibold ${tier.text}`} title="Based on likelihood and consequence of failure">
              Criticality: {tier.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {asset.assetNumber} · {asset.manufacturer} {asset.model} · {asset.class}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={asset.status} />
          {canManage && (
            <button type="button" onClick={() => setShowEditEquipment(true)} title="Edit equipment details" className="btn-secondary px-2.5 py-1.5 text-xs">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${tab === t.key ? "border-maroon-700 text-maroon-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <KpiGrid>
            <KpiCard label="Availability (90d)" value={`${availPct}%`} icon={Percent} accent={avail.accent} iconBg={avail.iconBg} hint="This asset" />
            <KpiCard label="Downtime (90d)" value={`${asset.downtimeDays90d}d`} icon={Clock} accent="text-slate-700" iconBg="bg-slate-100" hint={`${pastIssues.length} resolved issue${pastIssues.length !== 1 ? "s" : ""}`} />
            <KpiCard
              label="Avg. repair time"
              value={pastIssues.length > 0 ? `${Math.round((pastIssues.reduce((s, h) => s + h.downtimeDays, 0) / pastIssues.length) * 10) / 10}d` : "—"}
              icon={Wrench}
              accent="text-slate-700"
              iconBg="bg-slate-100"
              hint="MTTR, this asset"
            />
          </KpiGrid>

          {activeIssue && (
            <div className="card border-red-100 bg-red-50/60 p-4">
              <div className="mb-2 flex items-start justify-between">
                <p className="text-sm font-bold text-red-800">Active issue</p>
                {canManage && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setShowEditIssue(true)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Edit
                    </button>
                    <button type="button" onClick={() => setShowResolve(true)} className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
              <p className="mb-1 text-sm text-slate-800">{activeIssue.description}</p>
              <p className="text-xs text-slate-500">
                Identified {fmtDate(activeIssue.identifiedAt)} · Expected return {activeIssue.returnEta ? fmtDate(activeIssue.returnEta) : "TBD"}
              </p>
              <div className="mt-2.5 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {activeIssue.responsible}
                </span>
                {activeIssue.woNumber && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {activeIssue.woNumber}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-red-400">Last updated {new Date(activeIssue.updatedAt).toLocaleString()}</p>
            </div>
          )}

          <InfoCard title="Nameplate data" rows={{ "Asset number": asset.assetNumber, ...nameplate, Manufacturer: asset.manufacturer, Model: asset.model, "Serial number": asset.serial }} full />
        </div>
      )}

      {tab === "issues" && (
        <div>
          {activeIssue ? (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active</p>
                {canManage && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setShowEditIssue(true)} className="btn-secondary px-2.5 py-1 text-xs">
                      Edit
                    </button>
                    <button type="button" onClick={() => setShowResolve(true)} className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
              <div className="card p-4">
                <div className="mb-2.5 flex justify-between gap-3">
                  <p className="text-sm text-slate-800">{activeIssue.description}</p>
                  <StatusBadge status={activeIssue.condition === "unavailable" ? "unavailable" : "limited"} />
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-500">Next step</td>
                      <td className="py-1.5 text-right text-slate-800">{activeIssue.nextStep}</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-500">Responsible</td>
                      <td className="py-1.5 text-right text-slate-800">{activeIssue.responsible}</td>
                    </tr>
                    {activeIssue.partsEta && (
                      <tr className="border-t border-slate-100">
                        <td className="py-1.5 text-slate-500">Parts ETA</td>
                        <td className="py-1.5 text-right text-slate-800">{fmtDate(activeIssue.partsEta)}</td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-500">Return ETA</td>
                      <td className="py-1.5 text-right text-slate-800">{activeIssue.returnEta ? fmtDate(activeIssue.returnEta) : "—"}</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="py-1.5 text-slate-500">Work order</td>
                      <td className="py-1.5 text-right text-maroon-700">{activeIssue.woNumber || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mb-5 text-sm text-slate-500">No active issue.</p>
          )}
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Past</p>
          {pastIssues.length === 0 && <p className="text-sm text-slate-500">No prior issues on record.</p>}
          <div className="divide-y divide-slate-100">
            {pastIssues.map((h) => (
              <div key={h.id} className="py-2.5">
                <p className="mb-0.5 text-sm text-slate-700">{h.description}</p>
                <p className="text-xs text-slate-400">
                  Resolved {fmtDate(h.resolvedAt)} · {h.downtimeDays} day{h.downtimeDays !== 1 ? "s" : ""} downtime · Root cause: {h.rootCause}{" "}
                  {h.woNumber && (
                    <>
                      · <span className="text-maroon-700">{h.woNumber}</span>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "updates" && (
        <div className="divide-y divide-slate-100">
          {activeIssue && activeIssue.notes.length > 0 ? (
            [...activeIssue.notes].reverse().map((n) => (
              <div key={n.id} className="flex gap-2.5 py-2.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-700">{n.body}</p>
              </div>
            ))
          ) : (
            <p className="py-2.5 text-sm text-slate-500">No recent updates — updates appear here as an active issue progresses.</p>
          )}
        </div>
      )}

      {tab === "maintenance" && (
        <div>
          <p className="mb-3.5 text-xs text-slate-500">Major maintenance events on this asset. Work order detail lives in AIM.</p>
          {maintenance.length === 0 ? (
            <EmptyState icon={Box} title="No major maintenance on record" detail="Overhauls, replacements, and tests will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {maintenance.map((m) => (
                <div key={m.id} className="flex gap-3 py-3">
                  <span className="w-20 shrink-0 pt-0.5 font-mono text-[11px] text-slate-400">{fmtDate(m.date)}</span>
                  <div className="flex-1">
                    <span className="mb-0.5 inline-block rounded-full bg-maroon-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-maroon-700">{m.type.replace("_", " ")}</span>
                    <p className="text-sm text-slate-700">{m.description}</p>
                    <p className="text-[11px] text-slate-400">{m.woNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <p className="mb-3.5 text-xs text-slate-500">Datasheets, manuals, certificates, and photos for this asset.</p>
          {documents.length === 0 ? (
            <EmptyState icon={Search} title="No documents uploaded yet" detail="Manuals, certificates, and photos for this asset will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((d) => (
                <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between py-2.5 hover:text-maroon-800">
                  <div>
                    <p className="text-sm text-slate-700">{d.name}</p>
                    <p className="text-[11px] capitalize text-slate-400">
                      {d.type} · {fmtDate(d.uploadedAt)}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
