"use client";

import { ChevronDown, ChevronUp, ArrowUpDown, Download, X } from "lucide-react";
import type { ReactNode } from "react";
import { colors, statusMeta, type StatusKey } from "@/lib/theme";

export function StatusBadge({ status }: { status: StatusKey }) {
  const m = statusMeta[status];
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 4,
        background: m.bg,
        color: m.color,
        whiteSpace: "nowrap",
        letterSpacing: 0.2,
      }}
    >
      {m.label}
    </span>
  );
}

export type Kpi = { label: string; value: string; color?: string; detail?: string };

export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ background: colors.bgCardAlt, border: `1px solid ${colors.borderFaint}`, borderRadius: 10, padding: "13px 16px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11.5, color: colors.textGhost, fontWeight: 500 }}>{k.label}</p>
          <p style={{ margin: 0, fontSize: 21, fontWeight: 600, color: k.color || colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</p>
          {k.detail && <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.textGhostDark }}>{k.detail}</p>}
        </div>
      ))}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  tone,
  onClick,
  zeroDetail,
}: {
  label: string;
  value: number | string;
  tone: "unavailable" | "limited" | "neutral";
  onClick?: () => void;
  zeroDetail?: string;
}) {
  const isZero = value === 0;
  const color = isZero ? colors.ok : tone === "unavailable" ? colors.danger : tone === "limited" ? colors.warn : colors.textMuted;
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = "#3a4353")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = colors.border)}
    >
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: colors.textFaint, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      {isZero && zeroDetail && <p style={{ margin: "6px 0 0", fontSize: 11.5, color: colors.textGhost }}>{zeroDetail}</p>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</h3>
        {subtitle && <span style={{ fontSize: 12.5, color: colors.textGhost }}>{subtitle}</span>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; detail?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 20px", background: "#10151c", border: `1px dashed ${colors.border}`, borderRadius: 10, textAlign: "center" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors.okBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={16} color={colors.ok} />
      </div>
      <p style={{ margin: "0 0 3px", fontSize: 13.5, color: colors.textMuted, fontWeight: 500 }}>{title}</p>
      {detail && <p style={{ margin: 0, fontSize: 12.5, color: colors.textGhost }}>{detail}</p>}
    </div>
  );
}

export function InfoCard({ title, rows, full }: { title: string; rows: Record<string, ReactNode>; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ margin: "0 0 10px", fontSize: 13.5, fontWeight: 600, color: colors.text }}>{title}</p>
      <table style={{ width: "100%", fontSize: 13 }}>
        <tbody>
          {Object.entries(rows).map(([k, v]) => (
            <tr key={k}>
              <td style={{ color: colors.textFaint, padding: "5px 0" }}>{k}</td>
              <td style={{ textAlign: "right", color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  width,
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  dir: "asc" | "desc";
  onClick: (key: string) => void;
  width?: number | string;
}) {
  const active = sortKey === activeKey;
  return (
    <span
      onClick={() => onClick(sortKey)}
      style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", userSelect: "none", width, color: active ? colors.textMuted : colors.textGhost }}
    >
      {label}
      {active ? dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} /> : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />}
    </span>
  );
}

export function ExportButton({ onClick, label = "Export" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 34, borderRadius: 7, background: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 12.5, cursor: "pointer" }}
    >
      <Download size={13} /> {label}
    </button>
  );
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns: { label: string; value: (r: Record<string, unknown>) => unknown }[]) {
  const header = columns.map((c) => c.label).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => {
          const v = c.value(r);
          const s = v == null ? "" : String(v);
          return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
  const csv = header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ModalShell({ onClose, title, maxWidth = 440, children }: { onClose: () => void; title: string; maxWidth?: number; children: ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: `1px solid ${colors.border}`, borderRadius: 14, width: "100%", maxWidth, maxHeight: "90%", overflowY: "auto", padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{title}</h3>
          <X size={18} color={colors.textGhost} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
  pending,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #3a2318", borderRadius: 14, width: "100%", maxWidth: 380, padding: "20px 22px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: colors.textDim, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            style={{ flex: 1, padding: "10px 0", borderRadius: 7, border: `1px solid ${colors.danger}`, background: colors.dangerBg, color: colors.danger, fontSize: 13, fontWeight: 600, cursor: pending ? "not-allowed" : "pointer" }}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalActions({
  onCancel,
  onSave,
  saveLabel = "Save changes",
  disabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 7, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 13, cursor: "pointer" }}>
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{ flex: 2, padding: "10px 0", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? colors.border : colors.accent, color: disabled ? colors.textGhostDark : "#0a0d12" }}
      >
        {saveLabel}
      </button>
    </div>
  );
}
