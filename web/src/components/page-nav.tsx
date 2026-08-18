"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { LogIssueModal } from "./log-issue-modal";

type PickerAsset = { id: string; assetNumber: string; manufacturer: string; model: string; locationId: string; critScore: number };

export function PageNav({ canLogIssue, equipmentList }: { canLogIssue: boolean; equipmentList: PickerAsset[] }) {
  const pathname = usePathname();
  const [showLogModal, setShowLogModal] = useState(false);

  const equipmentMatch = pathname.match(/^\/equipment\/([^/]+)/);
  const currentAssetId = equipmentMatch ? decodeURIComponent(equipmentMatch[1]) : null;

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href || (n.href === "/equipment" && pathname.startsWith("/equipment/"));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? "bg-maroon-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          );
        })}
      </div>

      {canLogIssue && (
        <button type="button" onClick={() => setShowLogModal(true)} className="btn-primary whitespace-nowrap">
          + Log new issue
        </button>
      )}

      {showLogModal && <LogIssueModal onClose={() => setShowLogModal(false)} equipmentList={equipmentList} presetAssetId={currentAssetId} />}
    </nav>
  );
}
