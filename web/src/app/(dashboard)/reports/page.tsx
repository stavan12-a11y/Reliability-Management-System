import { getEquipmentList } from "@/lib/data/equipment";
import { getIssueHistory } from "@/lib/data/history";
import { getActiveIssues } from "@/lib/data/issues";
import { MetricCard, SectionHeader } from "@/components/ui";
import { colors } from "@/lib/theme";

export default async function ReportsPage() {
  const [equipment, history, issues] = await Promise.all([getEquipmentList(), getIssueHistory(), getActiveIssues()]);

  const byClass: Record<string, { total: number; unavailable: number; limited: number }> = {};
  equipment.forEach((e) => {
    if (!byClass[e.class]) byClass[e.class] = { total: 0, unavailable: 0, limited: 0 };
    byClass[e.class].total++;
    if (e.status === "unavailable") byClass[e.class].unavailable++;
    if (e.status === "limited") byClass[e.class].limited++;
  });

  const totalDowntime = history.reduce((s, h) => s + h.downtimeDays, 0) + equipment.reduce((s, e) => s + e.downtimeDays90d, 0);
  const overdueCount = issues.filter((i) => i.overdue).length;

  const assetCounts: Record<string, number> = {};
  history.forEach((h) => {
    assetCounts[h.assetId] = (assetCounts[h.assetId] || 0) + 1;
  });
  const recurring = Object.entries(assetCounts).filter(([, c]) => c > 1);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Total recorded downtime" value={`${totalDowntime}d`} tone="neutral" />
        <MetricCard label="Open issues overdue" value={overdueCount} tone="unavailable" />
        <MetricCard label="Assets w/ recurring issues" value={recurring.length} tone="limited" />
      </div>

      <SectionHeader title="Equipment class rollup" />
      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px", gap: 10, padding: "9px 14px", background: colors.bgCard, fontSize: 11.5, color: colors.textGhost, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span>Class</span>
          <span>Total</span>
          <span>Unavailable</span>
          <span>Limited</span>
        </div>
        {Object.entries(byClass).map(([cls, d], i) => (
          <div key={cls} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px", gap: 10, padding: "11px 14px", borderTop: i === 0 ? "none" : `1px solid ${colors.borderSubtle}` }}>
            <span style={{ fontSize: 13.5, color: colors.textMuted }}>{cls}</span>
            <span style={{ fontSize: 13, color: colors.textDim, fontFamily: "'JetBrains Mono', monospace" }}>{d.total}</span>
            <span style={{ fontSize: 13, color: d.unavailable ? colors.danger : colors.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>{d.unavailable}</span>
            <span style={{ fontSize: 13, color: d.limited ? colors.warn : colors.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>{d.limited}</span>
          </div>
        ))}
      </div>

      <SectionHeader title="Recurring issues" subtitle="Assets with more than one historical issue" />
      {recurring.length === 0 ? (
        <p style={{ fontSize: 13.5, color: colors.textGhost }}>No recurring issues on record.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recurring.map(([assetId, count]) => (
            <div key={assetId} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: colors.text }}>{assetId}</span>
              <span style={{ fontSize: 12.5, color: colors.textDim }}>{count} recorded issues</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
