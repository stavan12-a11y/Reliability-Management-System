import { prisma } from "@/lib/prisma";
import { assetAvailabilityPct, PERIOD_DAYS } from "@/lib/data/kpis";
import { criticalityTier } from "@/lib/theme";
import type { QuestionScope } from "./scope";

// Structured "current dashboard state" facts — KPIs, nameplate data, status
// — as opposed to search.ts's vector search over historical WO records.
// The chat needs both: this module answers "what is CHLR003's availability
// right now", vector search over issue_history/maintenance_log answers
// "has CHLR003 had bearing problems before".

async function assetFacts(id: string): Promise<string | null> {
  const asset = await prisma.equipment.findFirst({ where: { id, deletedAt: null }, include: { location: true, system: true } });
  if (!asset) return null;

  const [activeIssue, pastIssues] = await Promise.all([
    prisma.issue.findFirst({ where: { assetId: id } }),
    prisma.issueHistory.findMany({ where: { assetId: id } }),
  ]);

  const downtimeDays90d = Number(asset.downtimeDays90d);
  const availPct = assetAvailabilityPct(downtimeDays90d);
  const tier = criticalityTier(asset.critScore);
  const mttr = pastIssues.length > 0 ? Math.round((pastIssues.reduce((s, h) => s + h.downtimeDays, 0) / pastIssues.length) * 10) / 10 : null;
  const mtbf = pastIssues.length > 0 ? Math.round(((PERIOD_DAYS - downtimeDays90d) / pastIssues.length) * 10) / 10 : null;
  const nameplate = (asset.nameplate as Record<string, string>) ?? {};

  const lines = [
    `Asset ${asset.id} (asset number ${asset.assetNumber}) — ${asset.manufacturer} ${asset.model}, class: ${asset.class}.`,
    `Location: ${asset.location.name}, system: ${asset.system.name}.`,
    `Current status: ${asset.status}. Criticality: ${tier.label}.`,
    `Availability (trailing 90d): ${availPct}%. Downtime (90d): ${downtimeDays90d} day(s) across ${pastIssues.length} resolved issue(s) on record.`,
    `MTTR (mean time to repair): ${mttr != null ? `${mttr}d` : "not enough data"}. MTBF (mean time between failures): ${mtbf != null ? `${mtbf}d` : "not enough data"}.`,
    `Nameplate data — Serial: ${asset.serial}${Object.entries(nameplate).length ? ", " + Object.entries(nameplate).map(([k, v]) => `${k}: ${v}`).join(", ") : ""}.`,
    activeIssue
      ? `Active issue right now: ${activeIssue.description} (identified ${activeIssue.identifiedAt.toISOString().slice(0, 10)}, responsible ${activeIssue.responsible}, WO ${activeIssue.woNumber ?? "none on file"}).`
      : "No active issue on this asset right now.",
  ];
  return lines.join("\n");
}

async function classFacts(cls: string): Promise<string | null> {
  const equipment = await prisma.equipment.findMany({ where: { class: cls, deletedAt: null } });
  if (equipment.length === 0) return null;

  const ids = equipment.map((e) => e.id);
  const history = await prisma.issueHistory.findMany({ where: { assetId: { in: ids } } });

  const totalDays = equipment.length * PERIOD_DAYS;
  const totalDowntime = equipment.reduce((s, e) => s + Number(e.downtimeDays90d), 0);
  const availPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;
  const mttr = history.length > 0 ? Math.round((history.reduce((s, h) => s + h.downtimeDays, 0) / history.length) * 10) / 10 : null;
  const mtbf = history.length > 0 ? Math.round(((totalDays - totalDowntime) / history.length) * 10) / 10 : null;
  const available = equipment.filter((e) => e.status === "available").length;
  const limited = equipment.filter((e) => e.status === "limited").length;
  const unavailable = equipment.filter((e) => e.status === "unavailable").length;

  return [
    `Fleet-wide stats for the "${cls}" class (${equipment.length} assets across all locations):`,
    `Availability (90d): ${availPct}%. MTTR: ${mttr != null ? `${mttr}d` : "not enough data"}. MTBF: ${mtbf != null ? `${mtbf}d` : "not enough data"}.`,
    `Status breakdown: ${available} available, ${limited} limited, ${unavailable} unavailable.`,
    `Assets in this class: ${equipment.map((e) => e.id).join(", ")}.`,
  ].join("\n");
}

async function fleetFacts(): Promise<string> {
  const equipment = await prisma.equipment.findMany({ where: { deletedAt: null } });
  const history = await prisma.issueHistory.findMany();

  const totalDays = equipment.length * PERIOD_DAYS;
  const totalDowntime = equipment.reduce((s, e) => s + Number(e.downtimeDays90d), 0);
  const availPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;
  const mttr = history.length > 0 ? Math.round((history.reduce((s, h) => s + h.downtimeDays, 0) / history.length) * 10) / 10 : null;
  const available = equipment.filter((e) => e.status === "available").length;
  const limited = equipment.filter((e) => e.status === "limited").length;
  const unavailable = equipment.filter((e) => e.status === "unavailable").length;
  const byClass: Record<string, number> = {};
  equipment.forEach((e) => (byClass[e.class] = (byClass[e.class] || 0) + 1));

  return [
    `Fleet-wide stats (${equipment.length} assets total, all locations, all classes):`,
    `Availability (90d): ${availPct}%. MTTR: ${mttr != null ? `${mttr}d` : "not enough data"}.`,
    `Status breakdown: ${available} available, ${limited} limited, ${unavailable} unavailable.`,
    `By class: ${Object.entries(byClass).map(([c, n]) => `${c} (${n})`).join(", ")}.`,
  ].join("\n");
}

export async function buildDashboardContext(scope: QuestionScope): Promise<string | null> {
  if (scope.assetId) return assetFacts(scope.assetId);
  if (scope.assetClass) return classFacts(scope.assetClass);
  return fleetFacts();
}
