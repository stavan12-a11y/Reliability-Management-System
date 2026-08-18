"use client";

import { ChevronDown, ChevronUp, ArrowUpDown, Download, X } from "lucide-react";
import type { ReactNode, ComponentType } from "react";
import { statusMeta, type StatusKey } from "@/lib/theme";

export function StatusBadge({ status }: { status: StatusKey }) {
  const m = statusMeta[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${m.bg} ${m.border} ${m.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function CriticalityBadge({ tier }: { tier: { label: string; text: string; bg: string; border: string; dot: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold ${tier.bg} ${tier.border} ${tier.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-[2px] ${tier.dot}`} />
      {tier.label}
    </span>
  );
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

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{children}</div>;
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
