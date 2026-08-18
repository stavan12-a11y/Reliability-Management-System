"use client";

import { ChevronDown, ChevronUp, ArrowUpDown, Download, X } from "lucide-react";
import type { ReactNode, ComponentType } from "react";
import { statusMeta, type StatusKey } from "@/lib/theme";

export function StatusBadge({ status }: { status: StatusKey }) {
  const m = statusMeta[status];
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${m.bg} ${m.border} ${m.text}`}>{m.label}</span>;
}

export function CriticalityBadge({ tier }: { tier: { label: string; text: string; bg: string; border: string } }) {
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${tier.bg} ${tier.border} ${tier.text}`}>{tier.label}</span>;
}

export type KpiCardProps = {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  iconBg: string;
  hint?: string;
  onClick?: () => void;
};

export function KpiCard({ label, value, icon: Icon, accent, iconBg, hint, onClick }: KpiCardProps) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`card flex w-full items-center gap-4 p-4 text-left transition-all ${clickable ? "cursor-pointer hover:shadow-card-hover" : "cursor-default"}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-slate-500">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
    </button>
  );
}

// Fluid auto-fit grid instead of fixed breakpoint columns: each row fills
// evenly with however many cards actually fit, so a row of 6 doesn't leave
// a lone orphan card wrapped onto its own line the way a fixed 5-col grid
// would.
export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">{children}</div>;
}

export function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail }: { icon: ComponentType<{ className?: string }>; title: string; detail?: string }) {
  return (
    <div className="card p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-2 text-sm font-semibold text-slate-600">{title}</p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

// Hand-rolled SVG charts (no charting library dependency): a simple line
// chart for the availability trend and a Pareto chart (count bars + a
// cumulative-% line) for failure-mode analysis. Both use fixed maroon-700
// (#8b1d40) / slate hex values directly since SVG attributes can't read
// Tailwind's CSS variables.

export function TrendLineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  const width = 640;
  const height = 160;
  const padX = 24;
  const padY = 24;
  const values = data.map((d) => d.value);
  const max = Math.max(100, ...values);
  const min = Math.min(...values, max - 10);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    ...d,
    x: padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2),
    y: padY + (1 - (d.value - min) / range) * (height - padY * 2),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 180 }}>
      {[0, 0.5, 1].map((t) => {
        const y = padY + t * (height - padY * 2);
        const val = Math.round(max - t * range);
        return (
          <g key={t}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padX} y={y - 4} fontSize="10" fill="#94a3b8">
              {val}%
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#8b1d40" strokeWidth={2} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#8b1d40" />
          <text x={p.x} y={height - 4} fontSize="10" fill="#64748b" textAnchor="middle">
            {p.label}
          </text>
          <title>{`${p.label}: ${p.value}%`}</title>
        </g>
      ))}
    </svg>
  );
}

export function ParetoChart({ data }: { data: { label: string; count: number }[] }) {
  if (data.length === 0) return null;
  const width = 640;
  const height = 220;
  const padX = 16;
  const padTop = 16;
  const padBottom = 46;
  const chartH = height - padTop - padBottom;
  const barGap = 10;
  const barW = Math.min(96, (width - padX * 2 - barGap * (data.length - 1)) / data.length);
  const total = data.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count));

  const points = data.map((d, i) => {
    const cumCount = data.slice(0, i + 1).reduce((s, e) => s + e.count, 0);
    const cumPct = (cumCount / total) * 100;
    const x = padX + i * (barW + barGap) + barW / 2;
    const barH = (d.count / maxCount) * chartH;
    return { ...d, x, barH, barY: padTop + (chartH - barH), lineY: padTop + (1 - cumPct / 100) * chartH, cumPct };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.lineY.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 240 }}>
      {[0, 50, 100].map((pct) => {
        const y = padTop + (1 - pct / 100) * chartH;
        return (
          <g key={pct}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={width - padX} y={y - 3} fontSize="10" fill="#94a3b8" textAnchor="end">
              {pct}%
            </text>
          </g>
        );
      })}
      {points.map((p) => (
        <g key={p.label}>
          <rect x={p.x - barW / 2} y={p.barY} width={barW} height={p.barH} rx={3} fill="#b32a51" opacity={0.85} />
          <text x={p.x} y={padTop + chartH + 14} fontSize="10" fill="#475569" textAnchor="middle">
            {p.count}
          </text>
          <text x={p.x} y={padTop + chartH + 30} fontSize="9.5" fill="#64748b" textAnchor="middle">
            {p.label.length > 18 ? p.label.slice(0, 17) + "…" : p.label}
          </text>
          <title>{`${p.label}: ${p.count} (${p.cumPct.toFixed(0)}% cumulative)`}</title>
        </g>
      ))}
      <path d={linePath} fill="none" stroke="#8b1d40" strokeWidth={2} />
      {points.map((p) => (
        <circle key={`${p.label}-dot`} cx={p.x} cy={p.lineY} r={3} fill="#8b1d40" />
      ))}
    </svg>
  );
}

export function InfoCard({ title, rows, full }: { title: string; rows: Record<string, ReactNode>; full?: boolean }) {
  return (
    <div className={`card p-4 ${full ? "sm:col-span-2" : ""}`}>
      <p className="mb-3 text-sm font-bold text-slate-900">{title}</p>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(rows).map(([k, v]) => (
            <tr key={k} className="border-t border-slate-100 first:border-t-0">
              <td className="py-1.5 pr-3 text-slate-500">{k}</td>
              <td className="py-1.5 text-right font-medium text-slate-800">{v}</td>
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
      style={width ? { width } : undefined}
      className={`flex cursor-pointer select-none items-center gap-1 ${active ? "text-slate-700" : "text-slate-400"}`}
    >
      {label}
      {active ? dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </span>
  );
}

export function ExportButton({ onClick, label = "Export" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary whitespace-nowrap">
      <Download className="h-4 w-4" /> {label}
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

export function ModalShell({
  onClose,
  title,
  size = "md",
  children,
}: {
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const sizeClass = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" className={`relative z-10 w-full ${sizeClass} animate-fade-in rounded-2xl bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden />
      <div onClick={(e) => e.stopPropagation()} className="relative z-10 w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn flex-1 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 disabled:opacity-50"
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
    <div className="mt-2 flex gap-3">
      <button type="button" onClick={onCancel} className="btn-secondary flex-1">
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={disabled} className="btn-primary flex-[2]">
        {saveLabel}
      </button>
    </div>
  );
}
