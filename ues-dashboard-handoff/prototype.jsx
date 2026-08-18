import React, { useState, useMemo } from "react";
import {
  Search, Home, MapPin, Box, AlertTriangle, History, BarChart3,
  ChevronRight, ExternalLink, User, Clock, ChevronDown, ChevronUp, X,
  Flame, Snowflake, Droplet, Gauge, Download, Bell, Check, Pencil,
  CheckCircle2, ArrowUpDown
} from "lucide-react";

// ---------- Sample data ----------

const LOCATIONS = [
  { id: "central", name: "Central Utility Plant" },
  { id: "west", name: "West Campus Plant" },
  { id: "south", name: "South Plant" },
];

const SYSTEMS = [
  { id: "chw", locationId: "central", name: "Chilled Water System", icon: Snowflake },
  { id: "steam", locationId: "central", name: "Steam System", icon: Flame },
  { id: "hw", locationId: "west", name: "Heating Water System", icon: Droplet },
  { id: "chw-w", locationId: "west", name: "Chilled Water System", icon: Snowflake },
  { id: "steam-s", locationId: "south", name: "Steam System", icon: Flame },
];

// Criticality analysis: tiered (Critical/High/Medium/Low), no numeric score shown to users
function criticalityTier(score) {
  if (score >= 17) return { label: "Critical", color: "#e24b4a" };
  if (score >= 10) return { label: "High", color: "#ba7517" };
  if (score >= 5) return { label: "Medium", color: "#c9a227" };
  return { label: "Low", color: "#5f9c2a" };
}

// Availability tracking: hours in period + downtime hours, per asset (trailing 90 days)
const PERIOD_DAYS = 90; // trailing 90-day window used for KPI calcs

function daysBetween(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function assetAvailabilityPct(asset) {
  const pct = ((PERIOD_DAYS - asset.downtimeDays) / PERIOD_DAYS) * 100;
  return Math.round(pct * 10) / 10;
}

function fleetKpis(equipmentList, issuesList) {
  const totalDays = equipmentList.length * PERIOD_DAYS;
  const totalDowntime = equipmentList.reduce((s, e) => s + e.downtimeDays, 0);
  const availabilityPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;

  const criticalAssets = equipmentList.filter((e) => criticalityTier(e.critScore).label === "Critical");
  const criticalDays = criticalAssets.length * PERIOD_DAYS;
  const criticalDowntime = criticalAssets.reduce((s, e) => s + e.downtimeDays, 0);
  const criticalAvailabilityPct = criticalDays > 0 ? Math.round(((criticalDays - criticalDowntime) / criticalDays) * 1000) / 10 : 100;

  const relevantHistory = HISTORY.filter((h) => equipmentList.some((e) => e.id === h.assetId));
  const mttrDays = relevantHistory.length > 0 ? Math.round((relevantHistory.reduce((s, h) => s + h.downtimeDays, 0) / relevantHistory.length) * 10) / 10 : null;

  const relevantIssues = issuesList.filter((i) => equipmentList.some((e) => e.id === i.assetId));

  const assetCounts = {};
  relevantHistory.forEach((h) => { assetCounts[h.assetId] = (assetCounts[h.assetId] || 0) + 1; });
  const repeatOffenders = Object.values(assetCounts).filter((c) => c > 1).length;

  return { availabilityPct, criticalAvailabilityPct, mttrDays, repeatOffenders, totalDowntime };
}

function KpiRow({ kpis }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ background: "#12171f", border: "1px solid #1e2530", borderRadius: 10, padding: "13px 16px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11.5, color: "#6b7280", fontWeight: 500 }}>{k.label}</p>
          <p style={{ margin: 0, fontSize: 21, fontWeight: 600, color: k.color || "#c9d1d9", fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</p>
          {k.detail && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4a5261" }}>{k.detail}</p>}
        </div>
      ))}
    </div>
  );
}

function availabilityColor(pct) {
  if (pct == null) return "#6b7280";
  if (pct >= 97) return "#5f9c2a";
  if (pct >= 90) return "#c9a227";
  return "#e24b4a";
}

const EQUIPMENT = [
  { id: "CHLR003", assetNumber: "AST-10032", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "Trane", model: "CVHF450", serial: "TR-2019-4471", status: "unavailable", critScore: 20, critLikelihood: 4, critConsequence: 5, nameplate: { Tonnage: "450", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2019" }, downtimeDays: 4 },
  { id: "CHLR001", assetNumber: "AST-10030", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "Trane", model: "CVHF450", serial: "TR-2019-4469", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Tonnage: "450", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2019" }, downtimeDays: 0 },
  { id: "CHLR002", assetNumber: "AST-10031", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "York", model: "YK-EP", serial: "YK-2018-2210", status: "limited", critScore: 12, critLikelihood: 3, critConsequence: 4, nameplate: { Tonnage: "400", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2018" }, downtimeDays: 1 },
  { id: "CHWP001", assetNumber: "AST-10040", systemId: "chw", locationId: "central", class: "Pump", manufacturer: "Bell & Gossett", model: "e-1510", serial: "BG-2020-119", status: "available", critScore: 9, critLikelihood: 2, critConsequence: 4, nameplate: { Flow: "1200 gpm", Head: "85 ft", "Oil type": "ISO 32", "Install year": "2020" }, downtimeDays: 0 },
  { id: "BLR011", assetNumber: "AST-10050", systemId: "steam", locationId: "central", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-700", serial: "CB-2017-881", status: "limited", critScore: 22, critLikelihood: 4, critConsequence: 5, nameplate: { Capacity: "700 HP", Fuel: "Natural gas", MAWP: "150 psi", "Install year": "2017" }, downtimeDays: 2 },
  { id: "BLR012", assetNumber: "AST-10051", systemId: "steam", locationId: "central", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-700", serial: "CB-2017-882", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Capacity: "700 HP", Fuel: "Natural gas", MAWP: "150 psi", "Install year": "2017" }, downtimeDays: 1 },
  { id: "BFWP001", assetNumber: "AST-10060", systemId: "steam", locationId: "central", class: "Pump", manufacturer: "Goulds", model: "3196", serial: "GD-2019-556", status: "available", critScore: 8, critLikelihood: 2, critConsequence: 4, nameplate: { Flow: "300 gpm", Head: "450 ft", "Oil type": "ISO 68", "Install year": "2019" }, downtimeDays: 0 },
  { id: "HTC001", assetNumber: "AST-10070", systemId: "hw", locationId: "west", class: "Heat converter", manufacturer: "Patterson-Kelley", model: "MPS-15", serial: "PK-2016-330", status: "unavailable", critScore: 14, critLikelihood: 3, critConsequence: 4, nameplate: { Duty: "15 MMBtu/hr", "Surface area": "600 ft²", "Design pressure": "150 psi", "Install year": "2016" }, downtimeDays: 2 },
  { id: "HWP001", assetNumber: "AST-10071", systemId: "hw", locationId: "west", class: "Pump", manufacturer: "Bell & Gossett", model: "e-1510", serial: "BG-2019-887", status: "unavailable", critScore: 12, critLikelihood: 3, critConsequence: 4, nameplate: { Flow: "900 gpm", Head: "70 ft", "Oil type": "ISO 32", "Install year": "2019" }, downtimeDays: 2 },
  { id: "CHLR010", assetNumber: "AST-10080", systemId: "chw-w", locationId: "west", class: "Chiller", manufacturer: "Carrier", model: "19XR", serial: "CR-2021-004", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Tonnage: "500", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2021" }, downtimeDays: 0 },
  { id: "BLR021", assetNumber: "AST-10090", systemId: "steam-s", locationId: "south", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-500", serial: "CB-2015-220", status: "limited", critScore: 15, critLikelihood: 3, critConsequence: 5, nameplate: { Capacity: "500 HP", Fuel: "Natural gas", MAWP: "125 psi", "Install year": "2015" }, downtimeDays: 1 },
];

const MAINTENANCE_LOG = [
  { id: "M-311", assetId: "CHLR003", date: "2025-03-14", type: "Overhaul", description: "Full compressor overhaul, replaced bearings and seals", wo: "WO-114800" },
  { id: "M-298", assetId: "CHLR003", date: "2024-08-02", type: "Component replacement", description: "Replaced oil filter and charged refrigerant", wo: "WO-112100" },
  { id: "M-340", assetId: "HWP001", date: "2024-10-11", type: "Component replacement", description: "Motor replaced, original motor bearing failure", wo: "WO-113500" },
  { id: "M-355", assetId: "BLR011", date: "2025-08-20", type: "Overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117200" },
  { id: "M-356", assetId: "BLR011", date: "2025-08-20", type: "Test", description: "Hydrostatic test performed, passed", wo: "WO-117200" },
  { id: "M-330", assetId: "BLR012", date: "2025-08-18", type: "Overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117180" },
  { id: "M-290", assetId: "CHLR002", date: "2024-06-05", type: "Component replacement", description: "Condenser tube cleaning and inspection", wo: "WO-111900" },
];

const DOCUMENTS = [
  { id: "D-1", assetId: "CHLR003", name: "Trane CVHF450 O&M Manual", type: "Manual", date: "2019-04-01" },
  { id: "D-2", assetId: "CHLR003", name: "Nameplate photo", type: "Photo", date: "2025-03-14" },
  { id: "D-3", assetId: "BLR011", name: "PSV test certificate — Aug 2025", type: "Certificate", date: "2025-08-20" },
  { id: "D-4", assetId: "BLR011", name: "Boiler inspection report", type: "Report", date: "2025-08-20" },
];

const ISSUES = [
  { id: "I-1042", assetId: "CHLR003", condition: "unavailable", description: "Low oil pressure on compressor bearing", identified: "2026-08-12", nextStep: "Await replacement bearing from vendor", responsible: "J. Alvarez", partsEta: "2026-08-15", returnEta: "2026-08-16", actualReturn: null, overdue: false, wo: "WO-118432", notes: ["Aug 12 — Oil pressure alarm triggered, unit taken offline", "Aug 13 — Bearing confirmed failed, part ordered", "Aug 14 — Vendor confirmed ship date"], lastUpdatedBy: "J. Alvarez", lastUpdatedAt: "Today 7:42 AM" },
  { id: "I-1039", assetId: "BLR011", condition: "limited", description: "Operating at reduced capacity, burner control fault", identified: "2026-08-10", nextStep: "Schedule controls tech for calibration", responsible: "M. Cho", partsEta: null, returnEta: "2026-08-19", actualReturn: null, overdue: false, wo: "WO-118401", notes: ["Aug 10 — Derated to 60% capacity as precaution"], lastUpdatedBy: "M. Cho", lastUpdatedAt: "Yesterday 4:10 PM" },
  { id: "I-1044", assetId: "HWP001", condition: "unavailable", description: "Bearing noise, vibration analysis pending", identified: "2026-08-08", nextStep: "Vibration analysis appointment", responsible: "M. Cho", partsEta: null, returnEta: "2026-08-13", actualReturn: null, overdue: true, wo: "WO-118390", notes: ["Aug 8 — Unusual noise reported by operator", "Aug 9 — Taken offline as precaution"], lastUpdatedBy: "M. Cho", lastUpdatedAt: "3 days ago" },
  { id: "I-1045", assetId: "HTC001", condition: "unavailable", description: "Tube leak identified during inspection", identified: "2026-08-11", nextStep: "Await parts for tube bundle repair", responsible: "J. Alvarez", partsEta: "2026-08-18", returnEta: "2026-08-20", actualReturn: null, overdue: false, wo: "WO-118420", notes: ["Aug 11 — Leak found during routine inspection"], lastUpdatedBy: "J. Alvarez", lastUpdatedAt: "Today 8:15 AM" },
  { id: "I-1030", assetId: "CHLR002", condition: "limited", description: "Tube fouling, reduced heat transfer efficiency", identified: "2026-08-05", nextStep: "Schedule tube cleaning", responsible: "S. Patel", partsEta: null, returnEta: "2026-08-22", actualReturn: null, overdue: false, wo: "WO-118350", notes: ["Aug 5 — Efficiency drop flagged by trending"], lastUpdatedBy: "S. Patel", lastUpdatedAt: "2 days ago" },
  { id: "I-1050", assetId: "BLR021", condition: "limited", description: "Safety valve set-pressure drift on last test", identified: "2026-08-13", nextStep: "Awaiting parts — overdue for scheduling", responsible: "S. Patel", partsEta: "2026-08-11", returnEta: "2026-08-14", actualReturn: null, overdue: true, wo: "WO-118388", notes: ["Aug 13 — Failed annual PSV test, flagged"], lastUpdatedBy: "S. Patel", lastUpdatedAt: "Today 6:50 AM" },
];

const HISTORY = [
  { id: "H-902", assetId: "CHLR003", description: "Refrigerant leak, low charge", resolved: "2026-05-02", downtimeDays: 2, rootCause: "Seal wear", wo: "WO-115210" },
  { id: "H-887", assetId: "BLR011", description: "Low water cutoff failure", resolved: "2026-03-14", downtimeDays: 1, rootCause: "Sensor fouling", wo: "WO-113980" },
  { id: "H-861", assetId: "CHLR002", description: "Compressor trip on high discharge temp", resolved: "2026-01-22", downtimeDays: 1, rootCause: "Condenser fouling", wo: "WO-111500" },
  { id: "H-840", assetId: "BLR011", description: "Fuel valve actuator failure", resolved: "2025-11-30", downtimeDays: 1, rootCause: "Actuator end-of-life", wo: "WO-109200" },
  { id: "H-820", assetId: "BLR011", description: "Ignition transformer failure", resolved: "2025-09-18", downtimeDays: 1, rootCause: "Component failure", wo: "WO-107100" },
];

const STATUS_META = {
  unavailable: { label: "Unavailable", color: "#e24b4a", bg: "rgba(226,75,74,0.12)" },
  limited: { label: "Limited", color: "#ba7517", bg: "rgba(186,117,23,0.14)" },
  available: { label: "Available", color: "#3b6d11", bg: "rgba(59,109,17,0.12)" },
};

const NAV = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "equipment", label: "Equipment", icon: Box },
  { id: "issues", label: "Active issues", icon: AlertTriangle },
  { id: "history", label: "Issue history", icon: History },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

// ---------- Small helpers ----------

function StatusBadge({ status }) {
  const m = STATUS_META[status];
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 4, background: m.bg, color: m.color, whiteSpace: "nowrap", letterSpacing: 0.2 }}>
      {m.label}
    </span>
  );
}

function assetById(id, list) {
  return (list || EQUIPMENT).find((e) => e.id === id);
}
function systemById(id) {
  return SYSTEMS.find((s) => s.id === id);
}
function locationById(id) {
  return LOCATIONS.find((l) => l.id === id);
}

// Generic sort hook: cycles asc -> desc -> off
function useSort(defaultKey) {
  const [sortKey, setSortKey] = useState(defaultKey || null);
  const [sortDir, setSortDir] = useState("asc");
  function toggleSort(key) {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir("asc"); }
  }
  function sortRows(rows, accessor) {
    if (!sortKey) return rows;
    const sorted = [...rows].sort((a, b) => {
      const av = accessor(a, sortKey), bv = accessor(b, sortKey);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }
  return { sortKey, sortDir, toggleSort, sortRows };
}

function SortableHeader({ label, sortKey, activeKey, dir, onClick, width }) {
  const active = sortKey === activeKey;
  return (
    <span onClick={() => onClick(sortKey)} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", userSelect: "none", width, color: active ? "#c9d1d9" : "#6b7280" }}>
      {label}
      {active ? (dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />}
    </span>
  );
}

function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows.map((r) => columns.map((c) => {
    const v = c.value(r);
    const s = v == null ? "" : String(v);
    return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ExportButton({ onClick, label = "Export" }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 34, borderRadius: 7,
      background: "#161b22", border: "1px solid #232a35", color: "#9aa4b2", fontSize: 12.5, cursor: "pointer"
    }}>
      <Download size={13} /> {label}
    </button>
  );
}

function EmptyState({ icon: Icon, title, detail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 20px", background: "#10151c", border: "1px dashed #232a35", borderRadius: 10, textAlign: "center" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(59,109,17,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={16} color="#5f9c2a" />
      </div>
      <p style={{ margin: "0 0 3px", fontSize: 13.5, color: "#c9d1d9", fontWeight: 500 }}>{title}</p>
      {detail && <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280" }}>{detail}</p>}
    </div>
  );
}

// ---------- Page: Overview ----------

function OverviewPage({ onOpenAsset, onGoto, issues, equipment }) {
  const [showDigest, setShowDigest] = useState(false);

  const counts = useMemo(() => {
    const unavailable = equipment.filter((e) => e.status === "unavailable").length;
    const limited = equipment.filter((e) => e.status === "limited").length;
    const overdue = issues.filter((i) => i.overdue).length;
    const awaitingParts = issues.filter((i) => i.partsEta).length;
    return { unavailable, limited, overdue, awaitingParts };
  }, [issues, equipment]);

  const fleetStats = useMemo(() => fleetKpis(equipment, issues), [issues, equipment]);

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      if ((b.overdue ? 1 : 0) !== (a.overdue ? 1 : 0)) return (b.overdue ? 1 : 0) - (a.overdue ? 1 : 0);
      return (assetById(b.assetId, equipment)?.critScore || 0) - (assetById(a.assetId, equipment)?.critScore || 0);
    });
  }, [issues, equipment]);

  const newSinceYesterday = issues.filter((i) => i.lastUpdatedAt.startsWith("Today")).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280" }}>Morning brief · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
        <button onClick={() => setShowDigest((s) => !s)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 30, borderRadius: 7,
          background: showDigest ? "#1d4e6f" : "#161b22", border: showDigest ? "1px solid #2c6890" : "1px solid #232a35",
          color: showDigest ? "#7cc4f0" : "#9aa4b2", fontSize: 12, cursor: "pointer"
        }}>
          <Bell size={12} /> Daily digest preview
        </button>
      </div>

      {showDigest && (
        <div style={{ background: "#161b22", border: "1px solid #2c6890", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 600, color: "#7cc4f0", textTransform: "uppercase", letterSpacing: 0.4 }}>Sent to reliability managers, 6:00 AM daily</p>
          <p style={{ margin: 0, fontSize: 13.5, color: "#c9d1d9", lineHeight: 1.6 }}>
            {counts.unavailable} assets unavailable, {counts.limited} operating with limitations. {counts.overdue} issue{counts.overdue !== 1 ? "s" : ""} overdue on next steps. {newSinceYesterday} update{newSinceYesterday !== 1 ? "s" : ""} logged since yesterday. Open the dashboard for details.
          </p>
        </div>
      )}

      <KpiRow kpis={[
        { label: "Fleet availability (90d)", value: `${fleetStats.availabilityPct}%`, color: availabilityColor(fleetStats.availabilityPct), detail: "All UES equipment" },
        { label: "Critical asset availability", value: `${fleetStats.criticalAvailabilityPct}%`, color: availabilityColor(fleetStats.criticalAvailabilityPct), detail: "Critical-tier only" },
        { label: "Avg. repair time (MTTR)", value: fleetStats.mttrDays != null ? `${fleetStats.mttrDays}d` : "—", detail: "Per resolved issue" },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Unavailable" value={counts.unavailable} tone="unavailable" onClick={() => onGoto("issues", "unavailable")} zeroDetail="No equipment currently down" />
        <MetricCard label="Operating limited" value={counts.limited} tone="limited" onClick={() => onGoto("issues", "limited")} zeroDetail="Everything at full capacity" />
        <MetricCard label="Overdue next steps" value={counts.overdue} tone="unavailable" onClick={() => onGoto("issues", "overdue")} zeroDetail="Nothing behind schedule" />
        <MetricCard label="Awaiting parts" value={counts.awaitingParts} tone="neutral" onClick={() => onGoto("issues", "all")} zeroDetail="No open parts orders" />
      </div>

      <SectionHeader title="Active issues" subtitle="Sorted by urgency and criticality" />
      <div>
        {sortedIssues.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All equipment available" detail="No active issues across UES right now." />
        ) : sortedIssues.map((issue) => (
          <IssueRow key={issue.id} issue={issue} onOpenAsset={onOpenAsset} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone, onClick, zeroDetail }) {
  const isZero = value === 0;
  const color = isZero ? "#5f9c2a" : tone === "unavailable" ? "#e24b4a" : tone === "limited" ? "#ba7517" : "#c9d1d9";
  return (
    <div onClick={onClick} style={{ cursor: "pointer", background: "#161b22", border: "1px solid #232a35", borderRadius: 10, padding: "16px 18px", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a4353")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#232a35")}>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "#8892a0", fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      {isZero && zeroDetail && <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#6b7280" }}>{zeroDetail}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#e6e9ee" }}>{title}</h3>
        {subtitle && <span style={{ fontSize: 12.5, color: "#6b7280" }}>{subtitle}</span>}
      </div>
      {right}
    </div>
  );
}

function IssueRow({ issue, onOpenAsset }) {
  const asset = assetById(issue.assetId);
  const loc = locationById(asset.locationId);
  const sys = systemById(asset.systemId);
  return (
    <div onClick={() => onOpenAsset(asset.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 4px", borderBottom: "1px solid #1d232d", gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600, color: "#e6e9ee" }}>{asset.id}</span>
          <span style={{ fontSize: 12.5, color: "#6b7280" }}>{loc.name} · {sys.name}</span>
          {issue.overdue && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#e24b4a", letterSpacing: 0.3 }}>OVERDUE</span>}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#9aa4b2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.description}</p>
      </div>
      <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
    </div>
  );
}

// ---------- Page: Locations ----------

function LocationsPage({ selectedLocation, setSelectedLocation, onOpenAsset, equipment, issues: allIssues }) {
  const loc = selectedLocation || LOCATIONS[0].id;
  const eq = equipment.filter((e) => e.locationId === loc);
  const systems = SYSTEMS.filter((s) => s.locationId === loc);
  const issues = allIssues.filter((i) => assetById(i.assetId, equipment)?.locationId === loc);
  const locStats = useMemo(() => fleetKpis(eq, issues), [loc, equipment, allIssues]);

  const counts = {
    available: eq.filter((e) => e.status === "available").length,
    limited: eq.filter((e) => e.status === "limited").length,
    unavailable: eq.filter((e) => e.status === "unavailable").length,
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {LOCATIONS.map((l) => (
          <button key={l.id} onClick={() => setSelectedLocation(l.id)} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 13.5, cursor: "pointer",
            background: loc === l.id ? "#1d4e6f" : "#161b22",
            color: loc === l.id ? "#7cc4f0" : "#9aa4b2",
            border: loc === l.id ? "1px solid #2c6890" : "1px solid #232a35"
          }}>{l.name}</button>
        ))}
      </div>

      <KpiRow kpis={[
        { label: "Availability (90d)", value: `${locStats.availabilityPct}%`, color: availabilityColor(locStats.availabilityPct), detail: "This plant" },
        { label: "Critical availability", value: `${locStats.criticalAvailabilityPct}%`, color: availabilityColor(locStats.criticalAvailabilityPct), detail: "Critical-tier only" },
        { label: "Avg. repair time", value: locStats.mttrDays != null ? `${locStats.mttrDays}d` : "—", detail: "MTTR, this plant" },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Available" value={counts.available} tone="neutral" />
        <MetricCard label="Limited" value={counts.limited} tone="limited" />
        <MetricCard label="Unavailable" value={counts.unavailable} tone="unavailable" />
      </div>

      <SectionHeader title="Active issues at this location" />
      <div style={{ marginBottom: 32 }}>
        {issues.length === 0 && <p style={{ fontSize: 13.5, color: "#6b7280" }}>No active issues at this location.</p>}
        {issues.map((issue) => <IssueRow key={issue.id} issue={issue} onOpenAsset={onOpenAsset} />)}
      </div>

      <SectionHeader title="Systems" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {systems.map((sys) => {
          const sysEq = eq.filter((e) => e.systemId === sys.id);
          const Icon = sys.icon;
          return (
            <div key={sys.id} style={{ background: "#161b22", border: "1px solid #232a35", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon size={16} color="#7cc4f0" />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e6e9ee" }}>{sys.name}</p>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{sysEq.length} assets</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {sysEq.map((e) => (
                  <div key={e.id} onClick={() => onOpenAsset(e.id)} style={{
                    cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                    padding: "5px 10px", borderRadius: 6,
                    background: STATUS_META[e.status].bg, color: STATUS_META[e.status].color,
                    border: `1px solid ${STATUS_META[e.status].color}33`
                  }}>{e.id}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Page: Equipment list ----------

function EquipmentPage({ onOpenAsset, equipment }) {
  const [viewBy, setViewBy] = useState("location");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const { sortKey, sortDir, toggleSort, sortRows } = useSort(null);

  const classes = ["All", ...Array.from(new Set(equipment.map((e) => e.class)))];

  const filtered = equipment.filter((e) => {
    if (classFilter !== "All" && e.class !== classFilter) return false;
    if (statusFilter !== "All" && e.status !== statusFilter) return false;
    if (query && !e.id.toLowerCase().includes(query.toLowerCase()) && !e.assetNumber.toLowerCase().includes(query.toLowerCase()) && !e.manufacturer.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const accessor = (row, key) => {
    if (key === "id") return row.id;
    if (key === "class") return row.class;
    if (key === "criticality") return row.critScore;
    if (key === "status") return row.status;
    return row[key];
  };
  const sortedFiltered = sortRows(filtered, accessor);

  const grouped = useMemo(() => {
    const map = {};
    sortedFiltered.forEach((e) => {
      const key = viewBy === "location" ? locationById(e.locationId).name : e.class;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [sortedFiltered, viewBy]);

  function exportCsv() {
    downloadCsv("equipment-register.csv", sortedFiltered, [
      { label: "Asset ID", value: (r) => r.id },
      { label: "Class", value: (r) => r.class },
      { label: "Location", value: (r) => locationById(r.locationId).name },
      { label: "System", value: (r) => systemById(r.systemId).name },
      { label: "Manufacturer", value: (r) => r.manufacturer },
      { label: "Model", value: (r) => r.model },
      { label: "Serial", value: (r) => r.serial },
      { label: "Status", value: (r) => r.status },
      { label: "Criticality", value: (r) => criticalityTier(r.critScore).label },
    ]);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#161b22", border: "1px solid #232a35", borderRadius: 7, padding: "0 10px", height: 34, flex: "1 1 220px" }}>
          <Search size={14} color="#6b7280" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, number, or manufacturer"
            style={{ background: "transparent", border: "none", outline: "none", color: "#e6e9ee", fontSize: 13, width: "100%" }} />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={selectStyle}>
          {classes.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option>All</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div style={{ display: "flex", background: "#161b22", border: "1px solid #232a35", borderRadius: 7, padding: 2 }}>
          {["location", "class"].map((v) => (
            <button key={v} onClick={() => setViewBy(v)} style={{
              padding: "6px 12px", fontSize: 12.5, borderRadius: 5, border: "none", cursor: "pointer",
              background: viewBy === v ? "#232a35" : "transparent", color: viewBy === v ? "#e6e9ee" : "#8892a0"
            }}>By {v}</button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "90px 90px 1fr 90px 90px 15px", gap: 12, padding: "0 14px", marginBottom: 6 }}>
        <SortableHeader label="Asset" sortKey="id" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <SortableHeader label="Class" sortKey="class" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <span></span>
        <SortableHeader label="Criticality" sortKey="criticality" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
        <span></span>
      </div>

      {sortedFiltered.length === 0 ? (
        <EmptyState icon={Search} title="No matching equipment" detail="Try a different search term or clear a filter." />
      ) : Object.entries(grouped).map(([group, items]) => (
        <div key={group} style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>{group}</p>
          <div style={{ border: "1px solid #232a35", borderRadius: 10, overflow: "hidden" }}>
            {items.map((e, i) => (
              <div key={e.id} onClick={() => onOpenAsset(e.id)} style={{
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderTop: i === 0 ? "none" : "1px solid #1d232d", background: "#0f1319"
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "#e6e9ee", width: 90 }}>{e.id}</span>
                <span style={{ fontSize: 12.5, color: "#8892a0", width: 90 }}>{e.class}</span>
                <span style={{ fontSize: 12.5, color: "#6b7280", flex: 1 }}>{e.manufacturer} {e.model}</span>
                <span style={{ fontSize: 12, color: criticalityTier(e.critScore).color, fontFamily: "'JetBrains Mono', monospace" }}>{criticalityTier(e.critScore).label}</span>
                <StatusBadge status={e.status} />
                <ChevronRight size={15} color="#4a5261" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const selectStyle = { background: "#161b22", border: "1px solid #232a35", borderRadius: 7, color: "#c9d1d9", fontSize: 13, padding: "0 10px", height: 34 };

// ---------- Page: Equipment profile ----------

function EquipmentProfilePage({ assetId, onBack, issues, equipment, history, onUpdateIssue, onUpdateEquipment, onResolveIssue, onDeleteIssue, onDeleteEquipment }) {
  const [tab, setTab] = useState("overview");
  const [showEditEquipment, setShowEditEquipment] = useState(false);
  const [showEditIssue, setShowEditIssue] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const asset = assetById(assetId, equipment);
  const loc = locationById(asset.locationId);
  const sys = systemById(asset.systemId);
  const activeIssue = issues.find((i) => i.assetId === assetId);
  const pastIssues = history.filter((h) => h.assetId === assetId);
  const maintenance = MAINTENANCE_LOG.filter((m) => m.assetId === assetId).sort((a, b) => b.date.localeCompare(a.date));
  const documents = DOCUMENTS.filter((d) => d.assetId === assetId);
  const tier = criticalityTier(asset.critScore);

  const tabs = ["overview", "issues", "updates", "maintenance", "documents"];

  return (
    <div>
      {showEditEquipment && <EditEquipmentModal asset={asset} onClose={() => setShowEditEquipment(false)} onSave={(updates) => { onUpdateEquipment(asset.id, updates); setShowEditEquipment(false); }} onDelete={() => onDeleteEquipment(asset.id)} />}
      {showEditIssue && activeIssue && <EditIssueModal issue={activeIssue} onClose={() => setShowEditIssue(false)} onSave={(updates) => { onUpdateIssue(activeIssue.id, updates); setShowEditIssue(false); }} onDelete={() => { onDeleteIssue(activeIssue.id); setShowEditIssue(false); }} />}
      {showResolve && activeIssue && <ResolveIssueModal issue={activeIssue} onClose={() => setShowResolve(false)} onResolve={(resolution) => { onResolveIssue(activeIssue.id, resolution); setShowResolve(false); }} />}

      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6b7280", cursor: "pointer", marginBottom: 14 }}>
        <span>{loc.name}</span><ChevronRight size={12} /><span>{sys.name}</span><ChevronRight size={12} /><span style={{ color: "#9aa4b2" }}>{asset.id}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 600, color: "#e6e9ee", fontFamily: "'JetBrains Mono', monospace" }}>{asset.id}</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#8892a0" }}>{asset.assetNumber} · {asset.manufacturer} {asset.model} · {asset.class}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusBadge status={asset.status} />
          <span title="Based on likelihood and consequence of failure" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 4, background: "#232a35", color: tier.color, fontWeight: 600 }}>{tier.label}</span>
          <button onClick={() => setShowEditEquipment(true)} title="Edit equipment details" style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid #232a35", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "#9aa4b2", fontSize: 12 }}>
            <Pencil size={11} /> Edit
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #232a35", marginBottom: 20, marginTop: 12, overflowX: "auto" }}>
        {tabs.map((t) => (
          <span key={t} onClick={() => setTab(t)} style={{
            padding: "9px 13px", fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize",
            color: tab === t ? "#7cc4f0" : "#8892a0",
            borderBottom: tab === t ? "2px solid #7cc4f0" : "2px solid transparent"
          }}>{t}</span>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <KpiRow kpis={[
            { label: "Availability (90d)", value: `${assetAvailabilityPct(asset)}%`, color: availabilityColor(assetAvailabilityPct(asset)), detail: "This asset" },
            { label: "Downtime (90d)", value: `${asset.downtimeDays}d`, detail: `${pastIssues.length} resolved issue${pastIssues.length !== 1 ? "s" : ""}` },
            { label: "Avg. repair time", value: pastIssues.length > 0 ? `${Math.round((pastIssues.reduce((s, h) => s + h.downtimeDays, 0) / pastIssues.length) * 10) / 10}d` : "—", detail: "MTTR, this asset" },
          ]} />
          {activeIssue && (
            <div style={{ background: "#1a1310", border: "1px solid #3a2318", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f0997b" }}>Active issue</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowEditIssue(true)} style={{ fontSize: 11.5, color: "#f0997b", background: "transparent", border: "1px solid #3a2318", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setShowResolve(true)} style={{ fontSize: 11.5, color: "#5f9c2a", background: "rgba(95,156,42,0.12)", border: "1px solid #3a5a1a", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Resolve</button>
                </div>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#e6e9ee" }}>{activeIssue.description}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#9aa4b2" }}>Identified {activeIssue.identified} · Expected return {activeIssue.returnEta || "TBD"}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12.5, color: "#9aa4b2" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={13} />{activeIssue.responsible}</span>
                {activeIssue.wo && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ExternalLink size={13} />{activeIssue.wo}</span>}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#5a4234" }}>Last updated by {activeIssue.lastUpdatedBy} · {activeIssue.lastUpdatedAt}</p>
            </div>
          )}
          <InfoCard title="Nameplate data" rows={{ "Asset number": asset.assetNumber, ...asset.nameplate, Manufacturer: asset.manufacturer, Model: asset.model, "Serial number": asset.serial }} full />
        </div>
      )}

      {tab === "issues" && (
        <div>
          {activeIssue ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Active</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setShowEditIssue(true)} style={{ fontSize: 11.5, color: "#9aa4b2", background: "transparent", border: "1px solid #232a35", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setShowResolve(true)} style={{ fontSize: 11.5, color: "#5f9c2a", background: "rgba(95,156,42,0.12)", border: "1px solid #3a5a1a", borderRadius: 5, padding: "3px 9px", cursor: "pointer" }}>Resolve</button>
                </div>
              </div>
              <IssueDetailCard issue={activeIssue} />
            </div>
          ) : <p style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 20 }}>No active issue.</p>}
          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Past</p>
          {pastIssues.length === 0 && <p style={{ fontSize: 13.5, color: "#6b7280" }}>No prior issues on record.</p>}
          {pastIssues.map((h) => (
            <div key={h.id} style={{ padding: "10px 0", borderTop: "1px solid #1d232d" }}>
              <p style={{ margin: "0 0 3px", fontSize: 13.5, color: "#c9d1d9" }}>{h.description}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Resolved {h.resolved} · {h.downtimeDays} day{h.downtimeDays !== 1 ? "s" : ""} downtime · Root cause: {h.rootCause} {h.wo && <>· <a href="#" style={{ color: "#7cc4f0" }}>{h.wo}</a></>}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "updates" && (
        <div>
          {activeIssue ? activeIssue.notes.slice().reverse().map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid #1d232d" }}>
              <Clock size={14} color="#6b7280" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: "#c9d1d9" }}>{n}</p>
            </div>
          )) : <p style={{ fontSize: 13.5, color: "#6b7280" }}>No recent updates — updates appear here as an active issue progresses.</p>}
        </div>
      )}

      {tab === "maintenance" && (
        <div>
          <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>Major maintenance events on this asset. Work order detail lives in AIM.</p>
          {maintenance.length === 0 ? (
            <EmptyState icon={Box} title="No major maintenance on record" detail="Overhauls, replacements, and tests will appear here." />
          ) : maintenance.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid #1d232d" }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#6b7280", width: 84, flexShrink: 0, paddingTop: 2 }}>{m.date}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#7cc4f0", padding: "1px 8px", borderRadius: 4, background: "rgba(124,196,240,0.1)" }}>{m.type}</span>
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 13.5, color: "#c9d1d9" }}>{m.description}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280" }}>{m.wo}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>Datasheets, manuals, certificates, and photos for this asset.</p>
          {documents.length === 0 ? (
            <EmptyState icon={Search} title="No documents uploaded yet" detail="Manuals, certificates, and photos for this asset will appear here." />
          ) : documents.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid #1d232d" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13.5, color: "#c9d1d9" }}>{d.name}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280" }}>{d.type} · {d.date}</p>
              </div>
              <ExternalLink size={14} color="#6b7280" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, rows, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined, background: "#161b22", border: "1px solid #232a35", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 600, color: "#e6e9ee" }}>{title}</p>
      <table style={{ width: "100%", fontSize: 13 }}>
        <tbody>
          {Object.entries(rows).map(([k, v]) => (
            <tr key={k}>
              <td style={{ color: "#8892a0", padding: "5px 0" }}>{k}</td>
              <td style={{ textAlign: "right", color: "#c9d1d9", fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueDetailCard({ issue }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #232a35", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#e6e9ee" }}>{issue.description}</p>
        <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
      </div>
      <table style={{ width: "100%", fontSize: 12.5 }}>
        <tbody>
          <tr><td style={{ color: "#6b7280", padding: "3px 0" }}>Next step</td><td style={{ textAlign: "right", color: "#c9d1d9" }}>{issue.nextStep}</td></tr>
          <tr><td style={{ color: "#6b7280", padding: "3px 0" }}>Responsible</td><td style={{ textAlign: "right", color: "#c9d1d9" }}>{issue.responsible}</td></tr>
          {issue.partsEta && <tr><td style={{ color: "#6b7280", padding: "3px 0" }}>Parts ETA</td><td style={{ textAlign: "right", color: "#c9d1d9" }}>{issue.partsEta}</td></tr>}
          <tr><td style={{ color: "#6b7280", padding: "3px 0" }}>Return ETA</td><td style={{ textAlign: "right", color: "#c9d1d9" }}>{issue.returnEta}</td></tr>
          <tr><td style={{ color: "#6b7280", padding: "3px 0" }}>Work order</td><td style={{ textAlign: "right", color: "#7cc4f0" }}>{issue.wo}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------- Page: Active Issues ----------

function ActiveIssuesPage({ filterTab, setFilterTab, onOpenAsset, issues, equipment, onUpdateIssue, onResolveIssue, onDeleteIssue }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ nextStep: "", returnEta: "" });
  const [fullEditIssue, setFullEditIssue] = useState(null);
  const [resolveIssue, setResolveIssue] = useState(null);
  const { sortKey, sortDir, toggleSort, sortRows } = useSort(null);

  const tabs = [
    { id: "all", label: "All" },
    { id: "unavailable", label: "Unavailable" },
    { id: "limited", label: "Limited" },
    { id: "awaiting", label: "Awaiting parts" },
    { id: "overdue", label: "Overdue" },
  ];

  const filtered = issues.filter((i) => {
    if (filterTab === "all") return true;
    if (filterTab === "awaiting") return !!i.partsEta;
    if (filterTab === "overdue") return i.overdue;
    return i.condition === filterTab;
  });

  const accessor = (row, key) => {
    if (key === "asset") return row.assetId;
    if (key === "responsible") return row.responsible;
    if (key === "returnEta") return row.returnEta;
    if (key === "condition") return row.condition;
    return row[key];
  };
  const sorted = sortRows(filtered, accessor);

  function startEdit(issue) {
    setEditingId(issue.id);
    setDraft({ nextStep: issue.nextStep, returnEta: issue.returnEta || "" });
  }
  function saveEdit(id) {
    onUpdateIssue(id, { nextStep: draft.nextStep, returnEta: draft.returnEta, overdue: false });
    setEditingId(null);
  }

  function exportCsv() {
    downloadCsv("active-issues.csv", sorted, [
      { label: "Asset", value: (r) => r.assetId },
      { label: "Location", value: (r) => locationById(assetById(r.assetId, equipment).locationId).name },
      { label: "Condition", value: (r) => r.condition },
      { label: "Description", value: (r) => r.description },
      { label: "Next step", value: (r) => r.nextStep },
      { label: "Responsible", value: (r) => r.responsible },
      { label: "Parts ETA", value: (r) => r.partsEta },
      { label: "Return ETA", value: (r) => r.returnEta },
      { label: "Overdue", value: (r) => r.overdue ? "Yes" : "No" },
      { label: "AIM WO", value: (r) => r.wo },
      { label: "Last updated by", value: (r) => r.lastUpdatedBy },
      { label: "Last updated at", value: (r) => r.lastUpdatedAt },
    ]);
  }

  return (
    <div>
      {fullEditIssue && <EditIssueModal issue={fullEditIssue} onClose={() => setFullEditIssue(null)} onSave={(updates) => { onUpdateIssue(fullEditIssue.id, updates); setFullEditIssue(null); }} onDelete={() => { onDeleteIssue(fullEditIssue.id); setFullEditIssue(null); }} />}
      {resolveIssue && <ResolveIssueModal issue={resolveIssue} onClose={() => setResolveIssue(null)} onResolve={(resolution) => { onResolveIssue(resolveIssue.id, resolution); setResolveIssue(null); }} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setFilterTab(t.id)} style={{
              padding: "6px 13px", borderRadius: 7, fontSize: 13, cursor: "pointer",
              background: filterTab === t.id ? "#232a35" : "transparent",
              color: filterTab === t.id ? "#e6e9ee" : "#8892a0",
              border: filterTab === t.id ? "1px solid #3a4353" : "1px solid #232a35"
            }}>{t.label}</button>
          ))}
        </div>
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing in this view" detail="No issues match this filter right now." />
      ) : (
        <div style={{ border: "1px solid #232a35", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px 85px 90px 100px", gap: 8, padding: "9px 14px", background: "#161b22", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span style={{ color: "#6b7280" }}>Issue / next step</span>
            <SortableHeader label="Responsible" sortKey="responsible" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Return ETA" sortKey="returnEta" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableHeader label="Condition" sortKey="condition" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
            <span></span>
          </div>
          {sorted.map((issue, i) => {
            const asset = assetById(issue.assetId, equipment);
            const editing = editingId === issue.id;
            return (
              <div key={issue.id} style={{ borderTop: i === 0 ? "none" : "1px solid #1d232d", background: "#0f1319" }}>
                <div onClick={() => !editing && onOpenAsset(asset.id)} style={{
                  cursor: editing ? "default" : "pointer", display: "grid", gridTemplateColumns: "90px 1fr 120px 85px 90px 100px", gap: 8,
                  padding: "12px 14px", alignItems: "center"
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: "#e6e9ee" }}>{asset.id}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, color: "#c9d1d9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.description}</p>
                    {editing ? (
                      <input value={draft.nextStep} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, nextStep: e.target.value }))}
                        style={{ fontSize: 11.5, background: "#0a0d12", border: "1px solid #3a4353", borderRadius: 4, padding: "3px 6px", color: "#e6e9ee", width: "100%" }} />
                    ) : (
                      <p style={{ margin: 0, fontSize: 11.5, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.nextStep}</p>
                    )}
                  </div>
                  <span style={{ fontSize: 12.5, color: "#9aa4b2" }}>{issue.responsible}</span>
                  {editing ? (
                    <input value={draft.returnEta} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft((d) => ({ ...d, returnEta: e.target.value }))}
                      style={{ fontSize: 12, background: "#0a0d12", border: "1px solid #3a4353", borderRadius: 4, padding: "3px 6px", color: "#e6e9ee", width: "100%" }} />
                  ) : (
                    <span style={{ fontSize: 12.5, color: issue.overdue ? "#e24b4a" : "#9aa4b2" }}>{issue.returnEta || "—"}</span>
                  )}
                  <StatusBadge status={issue.condition === "unavailable" ? "unavailable" : "limited"} />
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    {editing ? (
                      <button onClick={(e) => { e.stopPropagation(); saveEdit(issue.id); }} title="Save" style={{ background: "#1d4e6f", border: "1px solid #2c6890", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Check size={13} color="#7cc4f0" />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); startEdit(issue); }} title="Quick update" style={{ background: "transparent", border: "1px solid #232a35", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Pencil size={12} color="#6b7280" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setResolveIssue(issue); }} title="Resolve" style={{ background: "rgba(95,156,42,0.12)", border: "1px solid #3a5a1a", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <CheckCircle2 size={13} color="#5f9c2a" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: "0 14px 9px", fontSize: 10.5, color: "#4a5261" }}>
                  Updated by {issue.lastUpdatedBy} · {issue.lastUpdatedAt} · <span onClick={(e) => { e.stopPropagation(); setFullEditIssue(issue); }} style={{ cursor: "pointer", color: "#5a6272", textDecoration: "underline" }}>full edit</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Page: Issue History ----------

function IssueHistoryPage({ onOpenAsset, history }) {
  const { sortKey, sortDir, toggleSort, sortRows } = useSort("resolved");
  const accessor = (row, key) => key === "downtime" ? row.downtimeDays : key === "asset" ? row.assetId : row[key];
  const sorted = sortRows(history, accessor);

  function exportCsv() {
    downloadCsv("issue-history.csv", sorted, [
      { label: "Asset", value: (r) => r.assetId },
      { label: "Description", value: (r) => r.description },
      { label: "Resolved", value: (r) => r.resolved },
      { label: "Downtime (days)", value: (r) => r.downtimeDays },
      { label: "Root cause", value: (r) => r.rootCause },
      { label: "AIM WO", value: (r) => r.wo },
    ]);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <ExportButton onClick={exportCsv} label="Export to CSV" />
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={History} title="No resolved issues yet" detail="Resolved issues will show up here with root cause and downtime." />
      ) : (
      <div style={{ border: "1px solid #232a35", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 100px 90px 120px", gap: 10, padding: "9px 14px", background: "#161b22", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <SortableHeader label="Asset" sortKey="asset" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
          <span style={{ color: "#6b7280" }}>Issue</span>
          <SortableHeader label="Resolved" sortKey="resolved" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
          <SortableHeader label="Downtime" sortKey="downtime" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
          <span style={{ color: "#6b7280" }}>Root cause</span>
        </div>
        {sorted.map((h, i) => {
          const asset = assetById(h.assetId);
          return (
            <div key={h.id} onClick={() => onOpenAsset(asset.id)} style={{
              cursor: "pointer", display: "grid", gridTemplateColumns: "90px 1fr 100px 90px 120px", gap: 10,
              padding: "12px 14px", borderTop: i === 0 ? "none" : "1px solid #1d232d", alignItems: "center", background: "#0f1319"
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: "#e6e9ee" }}>{asset.id}</span>
              <span style={{ fontSize: 13, color: "#c9d1d9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.description}</span>
              <span style={{ fontSize: 12.5, color: "#9aa4b2" }}>{h.resolved}</span>
              <span style={{ fontSize: 12.5, color: "#9aa4b2", fontFamily: "'JetBrains Mono', monospace" }}>{h.downtimeDays}d</span>
              <span style={{ fontSize: 12.5, color: "#9aa4b2" }}>{h.rootCause}</span>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ---------- Page: Reports ----------

function ReportsPage({ equipment, history }) {
  const byClass = useMemo(() => {
    const map = {};
    equipment.forEach((e) => {
      if (!map[e.class]) map[e.class] = { total: 0, unavailable: 0, limited: 0 };
      map[e.class].total++;
      if (e.status === "unavailable") map[e.class].unavailable++;
      if (e.status === "limited") map[e.class].limited++;
    });
    return map;
  }, [equipment]);

  const totalDowntime = history.reduce((s, h) => s + h.downtimeDays, 0) + equipment.reduce((s, e) => s + e.downtimeDays, 0);
  const recurring = useMemo(() => {
    const counts = {};
    history.forEach((h) => { counts[h.assetId] = (counts[h.assetId] || 0) + 1; });
    return Object.entries(counts).filter(([, c]) => c > 1);
  }, [history]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Total recorded downtime" value={`${totalDowntime}d`} tone="neutral" />
        <MetricCard label="Open issues overdue" value={ISSUES.filter((i) => i.overdue).length} tone="unavailable" />
        <MetricCard label="Assets w/ recurring issues" value={recurring.length} tone="limited" />
      </div>

      <SectionHeader title="Equipment class rollup" />
      <div style={{ border: "1px solid #232a35", borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px", gap: 10, padding: "9px 14px", background: "#161b22", fontSize: 11.5, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span>Class</span><span>Total</span><span>Unavailable</span><span>Limited</span>
        </div>
        {Object.entries(byClass).map(([cls, d], i) => (
          <div key={cls} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px", gap: 10, padding: "11px 14px", borderTop: i === 0 ? "none" : "1px solid #1d232d" }}>
            <span style={{ fontSize: 13.5, color: "#c9d1d9" }}>{cls}</span>
            <span style={{ fontSize: 13, color: "#9aa4b2", fontFamily: "'JetBrains Mono', monospace" }}>{d.total}</span>
            <span style={{ fontSize: 13, color: d.unavailable ? "#e24b4a" : "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>{d.unavailable}</span>
            <span style={{ fontSize: 13, color: d.limited ? "#ba7517" : "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>{d.limited}</span>
          </div>
        ))}
      </div>

      <SectionHeader title="Recurring issues" subtitle="Assets with more than one historical issue" />
      {recurring.length === 0 ? <p style={{ fontSize: 13.5, color: "#6b7280" }}>No recurring issues on record.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recurring.map(([assetId, count]) => (
            <div key={assetId} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#161b22", border: "1px solid #232a35", borderRadius: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#e6e9ee" }}>{assetId}</span>
              <span style={{ fontSize: 12.5, color: "#9aa4b2" }}>{count} recorded issues</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Shared modal shell ----------

function ModalShell({ onClose, title, maxWidth = 440, children }) {
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #232a35", borderRadius: 14, width: "100%", maxWidth, maxHeight: "90%", overflowY: "auto", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6e9ee" }}>{title}</h3>
          <X size={18} color="#6b7280" style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldInputStyle = { width: "100%", background: "#0a0d12", border: "1px solid #232a35", borderRadius: 7, padding: "8px 10px", color: "#e6e9ee", fontSize: 13, boxSizing: "border-box" };
const fieldLabelStyle = { display: "block", fontSize: 12, color: "#8892a0", marginBottom: 5, fontWeight: 500 };

function ConfirmDialog({ title, message, confirmLabel = "Delete", onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #3a2318", borderRadius: 14, width: "100%", maxWidth: 380, padding: "20px 22px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: "#e6e9ee" }}>{title}</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "#9aa4b2", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: "1px solid #232a35", color: "#9aa4b2", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: "1px solid #e24b4a", background: "rgba(226,75,74,0.14)", color: "#e24b4a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saveLabel = "Save changes", disabled }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: "1px solid #232a35", color: "#9aa4b2", fontSize: 13, cursor: "pointer" }}>Cancel</button>
      <button onClick={onSave} disabled={disabled} style={{
        flex: 2, padding: "10px 0", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "#232a35" : "#7cc4f0", color: disabled ? "#4a5261" : "#0a0d12"
      }}>{saveLabel}</button>
    </div>
  );
}

// ---------- Edit equipment ----------

function EditEquipmentModal({ asset, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    assetNumber: asset.assetNumber, manufacturer: asset.manufacturer, model: asset.model, serial: asset.serial,
    nameplate: { ...asset.nameplate },
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function setNameplateField(key, value) {
    setForm((f) => ({ ...f, nameplate: { ...f.nameplate, [key]: value } }));
  }

  return (
    <>
      <ModalShell onClose={onClose} title={`Edit ${asset.id}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabelStyle}>Asset number</label>
            <input value={form.assetNumber} onChange={(e) => setForm((f) => ({ ...f, assetNumber: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Serial number</label>
            <input value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={fieldLabelStyle}>Manufacturer</label>
            <input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} style={fieldInputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Model</label>
            <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} style={fieldInputStyle} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "14px 0 8px", fontWeight: 500 }}>Nameplate data</p>
        {Object.entries(form.nameplate).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label style={fieldLabelStyle}>{key}</label>
            <input value={val} onChange={(e) => setNameplateField(key, e.target.value)} style={fieldInputStyle} />
          </div>
        ))}
        <p style={{ fontSize: 11.5, color: "#5a6272", margin: "4px 0 16px" }}>Use this when a component is replaced (e.g. new motor, new serial) so the asset record stays current.</p>
        <ModalActions onCancel={onClose} onSave={() => onSave(form)} />
        {onDelete && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1d232d", textAlign: "center" }}>
            <span onClick={() => setConfirmingDelete(true)} style={{ fontSize: 12, color: "#e24b4a", cursor: "pointer" }}>Delete this equipment record</span>
          </div>
        )}
      </ModalShell>
      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${asset.id}?`}
          message="This removes the asset and all its active issues and issue history. This can't be undone."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}

// ---------- Edit issue ----------

function EditIssueModal({ issue, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    description: issue.description, nextStep: issue.nextStep, responsible: issue.responsible,
    partsEta: issue.partsEta || "", returnEta: issue.returnEta || "", wo: issue.wo || "",
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
    <ModalShell onClose={onClose} title="Edit issue">
      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabelStyle}>Next step</label>
        <input value={form.nextStep} onChange={(e) => setForm((f) => ({ ...f, nextStep: e.target.value }))} style={fieldInputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={fieldLabelStyle}>Responsible party</label>
          <input value={form.responsible} onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))} style={fieldInputStyle} />
        </div>
        <div>
          <label style={fieldLabelStyle}>AIM work order</label>
          <input value={form.wo} onChange={(e) => setForm((f) => ({ ...f, wo: e.target.value }))} style={fieldInputStyle} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div>
          <label style={fieldLabelStyle}>Parts ETA</label>
          <input value={form.partsEta} onChange={(e) => setForm((f) => ({ ...f, partsEta: e.target.value }))} placeholder="YYYY-MM-DD" style={fieldInputStyle} />
        </div>
        <div>
          <label style={fieldLabelStyle}>Return ETA</label>
          <input value={form.returnEta} onChange={(e) => setForm((f) => ({ ...f, returnEta: e.target.value }))} placeholder="YYYY-MM-DD" style={fieldInputStyle} />
        </div>
      </div>
      <ModalActions onCancel={onClose} onSave={() => onSave({ ...form, partsEta: form.partsEta || null, returnEta: form.returnEta || null, wo: form.wo || null, overdue: false })} />
      {onDelete && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1d232d", textAlign: "center" }}>
          <span onClick={() => setConfirmingDelete(true)} style={{ fontSize: 12, color: "#e24b4a", cursor: "pointer" }}>Delete this issue</span>
        </div>
      )}
    </ModalShell>
    {confirmingDelete && (
      <ConfirmDialog
        title="Delete this issue?"
        message="This removes the issue entirely — it won't be logged in Issue History. Use Resolve instead if the issue is actually fixed."
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={onDelete}
      />
    )}
    </>
  );
}

// ---------- Resolve issue ----------

function ResolveIssueModal({ issue, onClose, onResolve }) {
  const [resolveType, setResolveType] = useState(issue.condition === "unavailable" ? "full" : "full");
  const [workDone, setWorkDone] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolvedDate, setResolvedDate] = useState(new Date().toISOString().slice(0, 10));
  const [downgradeNote, setDowngradeNote] = useState("");

  const canDowngrade = issue.condition === "unavailable";
  const canSubmitFull = workDone.trim().length > 0 && rootCause.trim().length > 0;
  const canSubmitDowngrade = downgradeNote.trim().length > 0;
  const previewDays = daysBetween(issue.identified, resolvedDate);

  function handleSubmit() {
    if (resolveType === "full") {
      if (!canSubmitFull) return;
      onResolve({ type: "full", workDone, rootCause, resolvedDate, downtimeDays: daysBetween(issue.identified, resolvedDate) });
    } else {
      if (!canSubmitDowngrade) return;
      onResolve({ type: "downgrade", note: downgradeNote });
    }
  }

  return (
    <ModalShell onClose={onClose} title={`Resolve issue — ${issue.assetId}`}>
      {canDowngrade && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setResolveType("full")} style={{
            flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12.5, cursor: "pointer", fontWeight: 500,
            background: resolveType === "full" ? "rgba(95,156,42,0.14)" : "#161b22",
            border: resolveType === "full" ? "1px solid #5f9c2a" : "1px solid #232a35",
            color: resolveType === "full" ? "#5f9c2a" : "#8892a0"
          }}>Fully resolved</button>
          <button onClick={() => setResolveType("downgrade")} style={{
            flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 12.5, cursor: "pointer", fontWeight: 500,
            background: resolveType === "downgrade" ? "rgba(186,117,23,0.14)" : "#161b22",
            border: resolveType === "downgrade" ? "1px solid #ba7517" : "1px solid #232a35",
            color: resolveType === "downgrade" ? "#ba7517" : "#8892a0"
          }}>Downgrade to limited</button>
        </div>
      )}

      {resolveType === "full" ? (
        <>
          <p style={{ fontSize: 11.5, color: "#6b7280", margin: "0 0 14px" }}>Asset returns to Available. This moves the issue to Issue History.</p>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>What was done</label>
            <textarea value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="e.g. Replaced compressor bearing and recharged refrigerant" rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabelStyle}>Root cause</label>
            <input value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="e.g. Bearing wear from lubrication gap" style={fieldInputStyle} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={fieldLabelStyle}>Resolved date</label>
            <input value={resolvedDate} onChange={(e) => setResolvedDate(e.target.value)} style={fieldInputStyle} />
          </div>
          <p style={{ fontSize: 11.5, color: "#6b7280", margin: "0 0 18px" }}>
            Downtime: <span style={{ color: "#c9d1d9", fontWeight: 600 }}>{previewDays} day{previewDays !== 1 ? "s" : ""}</span> — calculated from identified date ({issue.identified}) to resolved date.
          </p>
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel="Mark resolved" disabled={!canSubmitFull} />
        </>
      ) : (
        <>
          <p style={{ fontSize: 11.5, color: "#6b7280", margin: "0 0 14px" }}>Asset moves to Limited but stays running. The issue stays active.</p>
          <div style={{ marginBottom: 18 }}>
            <label style={fieldLabelStyle}>What changed</label>
            <textarea value={downgradeNote} onChange={(e) => setDowngradeNote(e.target.value)} placeholder="e.g. Temporary repair holding, running at reduced capacity" rows={2} style={{ ...fieldInputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <ModalActions onCancel={onClose} onSave={handleSubmit} saveLabel="Downgrade to limited" disabled={!canSubmitDowngrade} />
        </>
      )}
    </ModalShell>
  );
}

// ---------- Log new issue ----------

function LogIssueModal({ onClose, onSubmit, presetAssetId }) {
  const [assetId, setAssetId] = useState(presetAssetId || "");
  const [condition, setCondition] = useState("unavailable");
  const [description, setDescription] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [responsible, setResponsible] = useState("");
  const [returnEta, setReturnEta] = useState("");
  const [wo, setWo] = useState("");
  const [query, setQuery] = useState("");

  const asset = assetById(assetId);
  const tier = asset ? criticalityTier(asset.critScore) : null;
  const matches = query ? EQUIPMENT.filter((e) => e.id.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];


  const canSubmit = assetId && description.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const newIssue = {
      id: `I-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId, condition, description,
      identified: new Date().toISOString().slice(0, 10),
      nextStep: nextStep || "Not yet determined",
      responsible: responsible || "Unassigned",
      partsEta: null,
      returnEta: returnEta || null,
      actualReturn: null,
      overdue: false,
      wo: wo || null,
      notes: [`${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} — Issue logged: ${description}`],
      lastUpdatedBy: "You",
      lastUpdatedAt: "Just now",
    };
    onSubmit(newIssue);
  }

  const inputStyle = { width: "100%", background: "#0a0d12", border: "1px solid #232a35", borderRadius: 7, padding: "8px 10px", color: "#e6e9ee", fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: 12, color: "#8892a0", marginBottom: 5, fontWeight: 500 };

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #232a35", borderRadius: 14, width: "100%", maxWidth: 440, maxHeight: "90%", overflowY: "auto", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#e6e9ee" }}>Log new issue</h3>
          <X size={18} color="#6b7280" style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={labelStyle}>Asset</label>
          {asset ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#161b22", border: "1px solid #2c6890", borderRadius: 7, padding: "8px 10px" }}>
              <span style={{ fontSize: 13, color: "#e6e9ee", fontFamily: "'JetBrains Mono', monospace" }}>{asset.id} <span style={{ color: "#6b7280", fontFamily: "inherit" }}>· {asset.manufacturer} {asset.model}</span></span>
              <X size={14} color="#6b7280" style={{ cursor: "pointer" }} onClick={() => { setAssetId(""); setQuery(""); }} />
            </div>
          ) : (
            <>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset ID, e.g. CHLR003" style={inputStyle} />
              {matches.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#161b22", border: "1px solid #232a35", borderRadius: 7, marginTop: 4, overflow: "hidden", zIndex: 10 }}>
                  {matches.map((m) => (
                    <div key={m.id} onClick={() => { setAssetId(m.id); setQuery(""); }} style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", color: "#c9d1d9", borderTop: "1px solid #1d232d" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{m.id}</span> <span style={{ color: "#6b7280" }}>· {locationById(m.locationId).name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {asset && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161b22", borderRadius: 7, padding: "8px 10px", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "#8892a0" }}>Criticality (auto-filled from asset)</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.label}</span>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Condition</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setCondition("unavailable")} style={{
              flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 500,
              background: condition === "unavailable" ? "rgba(226,75,74,0.14)" : "#161b22",
              border: condition === "unavailable" ? "1px solid #e24b4a" : "1px solid #232a35",
              color: condition === "unavailable" ? "#e24b4a" : "#8892a0"
            }}>Unavailable</button>
            <button onClick={() => setCondition("limited")} style={{
              flex: 1, padding: "9px 0", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 500,
              background: condition === "limited" ? "rgba(186,117,23,0.14)" : "#161b22",
              border: condition === "limited" ? "1px solid #ba7517" : "1px solid #232a35",
              color: condition === "limited" ? "#ba7517" : "#8892a0"
            }}>Limited</button>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#6b7280" }}>
            {condition === "unavailable" ? "Asset is fully down and out of service." : "Asset is still running, but degraded or constrained."}
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's wrong, e.g. Low oil pressure on compressor bearing" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Responsible party</label>
            <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Return ETA (if known)</label>
            <input value={returnEta} onChange={(e) => setReturnEta(e.target.value)} placeholder="YYYY-MM-DD" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Next step</label>
          <input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="e.g. Await replacement bearing from vendor" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>AIM work order number (optional)</label>
          <input value={wo} onChange={(e) => setWo(e.target.value)} placeholder="e.g. WO-118500 — add later if not cut yet" style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: "1px solid #232a35", color: "#9aa4b2", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{
            flex: 2, padding: "10px 0", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed",
            background: canSubmit ? "#7cc4f0" : "#232a35", color: canSubmit ? "#0a0d12" : "#4a5261"
          }}>Log issue</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Root app ----------

export default function App() {
  const [page, setPage] = useState("overview");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("central");
  const [issueFilterTab, setIssueFilterTab] = useState("all");
  const [globalQuery, setGlobalQuery] = useState("");
  const [issues, setIssues] = useState(ISSUES);
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [history, setHistory] = useState(HISTORY);
  const [showLogModal, setShowLogModal] = useState(false);

  function openAsset(id) {
    setSelectedAsset(id);
    setPage("equipment-profile");
  }

  function goto(pageId, sub) {
    if (pageId === "issues") { setIssueFilterTab(sub || "all"); setPage("issues"); }
    else if (pageId === "locations") { setSelectedLocation(sub); setPage("locations"); }
    else setPage(pageId);
  }

  function handleGlobalSearch(e) {
    if (e.key === "Enter" && globalQuery.trim()) {
      const match = equipment.find((eq) => eq.id.toLowerCase() === globalQuery.trim().toLowerCase() || eq.assetNumber.toLowerCase() === globalQuery.trim().toLowerCase());
      if (match) { openAsset(match.id); setGlobalQuery(""); }
    }
  }

  function handleNewIssue(newIssue) {
    setIssues((prev) => [newIssue, ...prev]);
    setEquipment((prev) => prev.map((e) => e.id === newIssue.assetId ? { ...e, status: newIssue.condition } : e));
    setShowLogModal(false);
    openAsset(newIssue.assetId);
  }

  function handleUpdateIssue(id, updates) {
    setIssues((prev) => prev.map((i) => i.id === id ? { ...i, ...updates, lastUpdatedBy: "You", lastUpdatedAt: "Just now" } : i));
  }

  function handleUpdateEquipment(id, updates) {
    setEquipment((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
  }

  function handleResolveIssue(issueId, resolution) {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;
    if (resolution.type === "full") {
      setHistory((prev) => [{
        id: `H-${Math.floor(900 + Math.random() * 99)}`,
        assetId: issue.assetId,
        description: resolution.workDone,
        resolved: resolution.resolvedDate,
        downtimeDays: resolution.downtimeDays,
        rootCause: resolution.rootCause,
        wo: issue.wo,
      }, ...prev]);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      setEquipment((prev) => prev.map((e) => e.id === issue.assetId ? { ...e, status: "available", downtimeDays: e.downtimeDays + resolution.downtimeDays } : e));
    } else {
      // downgrade unavailable -> limited, stays active
      setIssues((prev) => prev.map((i) => i.id === issueId ? { ...i, condition: "limited", lastUpdatedBy: "You", lastUpdatedAt: "Just now", notes: [...i.notes, `${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} — Downgraded to limited: ${resolution.note}`] } : i));
      setEquipment((prev) => prev.map((e) => e.id === issue.assetId ? { ...e, status: "limited" } : e));
    }
  }

  function handleDeleteIssue(issueId) {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
  }

  function handleDeleteEquipment(assetIdToDelete) {
    setEquipment((prev) => prev.filter((e) => e.id !== assetIdToDelete));
    setIssues((prev) => prev.filter((i) => i.assetId !== assetIdToDelete));
    setHistory((prev) => prev.filter((h) => h.assetId !== assetIdToDelete));
    setPage("equipment");
  }

  const pageTitle = NAV.find((n) => n.id === page)?.label || (page === "equipment-profile" ? "Equipment" : "");

  return (
    <div style={{ display: "flex", minHeight: 600, background: "#0a0d12", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", borderRadius: 12, overflow: "hidden", border: "1px solid #1d232d", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap');
        input::placeholder, textarea::placeholder { color: #4a5261; }
        select { -webkit-appearance: none; }
      `}</style>

      {showLogModal && <LogIssueModal onClose={() => setShowLogModal(false)} onSubmit={handleNewIssue} presetAssetId={page === "equipment-profile" ? selectedAsset : null} />}

      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0, background: "#0d1117", borderRight: "1px solid #1d232d", padding: "18px 12px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", marginBottom: 22 }}>
          <Gauge size={18} color="#7cc4f0" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e6e9ee" }}>UES Reliability</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.id || (page === "equipment-profile" && n.id === "equipment");
            return (
              <div key={n.id} onClick={() => setPage(n.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                background: active ? "#1a212c" : "transparent", color: active ? "#e6e9ee" : "#8892a0"
              }}>
                <Icon size={15} />
                <span style={{ fontSize: 13.5 }}>{n.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: "10px 8px", fontSize: 11, color: "#4a5261" }}>
          Maintenance data managed in AIM
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px", borderBottom: "1px solid #1d232d" }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#e6e9ee" }}>{pageTitle}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#161b22", border: "1px solid #232a35", borderRadius: 7, padding: "0 10px", height: 32, width: 220 }}>
              <Search size={13} color="#6b7280" />
              <input value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)} onKeyDown={handleGlobalSearch}
                placeholder="Jump to asset, e.g. CHLR003" style={{ background: "transparent", border: "none", outline: "none", color: "#e6e9ee", fontSize: 12.5, width: "100%" }} />
            </div>
            <button onClick={() => setShowLogModal(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 32, borderRadius: 7,
              background: "#7cc4f0", border: "1px solid #7cc4f0", color: "#0a0d12", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
            }}>
              + Log new issue
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>
          {page === "overview" && <OverviewPage onOpenAsset={openAsset} onGoto={goto} issues={issues} equipment={equipment} />}
          {page === "locations" && <LocationsPage selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} onOpenAsset={openAsset} equipment={equipment} issues={issues} />}
          {page === "equipment" && <EquipmentPage onOpenAsset={openAsset} equipment={equipment} />}
          {page === "equipment-profile" && <EquipmentProfilePage assetId={selectedAsset} onBack={() => setPage("equipment")} issues={issues} equipment={equipment} history={history} onUpdateIssue={handleUpdateIssue} onUpdateEquipment={handleUpdateEquipment} onResolveIssue={handleResolveIssue} onDeleteIssue={handleDeleteIssue} onDeleteEquipment={handleDeleteEquipment} />}
          {page === "issues" && <ActiveIssuesPage filterTab={issueFilterTab} setFilterTab={setIssueFilterTab} onOpenAsset={openAsset} issues={issues} equipment={equipment} onUpdateIssue={handleUpdateIssue} onResolveIssue={handleResolveIssue} onDeleteIssue={handleDeleteIssue} />}
          {page === "history" && <IssueHistoryPage onOpenAsset={openAsset} history={history} />}
          {page === "reports" && <ReportsPage equipment={equipment} history={history} />}
        </div>
      </div>
    </div>
  );
}
