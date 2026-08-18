"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, LogOut, Gauge } from "lucide-react";
import { LogIssueModal } from "./log-issue-modal";
import { signOutAction } from "@/lib/actions/auth-signout";

type PickerAsset = { id: string; assetNumber: string; manufacturer: string; model: string; locationId: string; critScore: number };

export function Header({
  canLogIssue,
  equipmentList,
  userName,
}: {
  canLogIssue: boolean;
  equipmentList: PickerAsset[];
  userName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const equipmentMatch = pathname.match(/^\/equipment\/([^/]+)/);
  const currentAssetId = equipmentMatch ? decodeURIComponent(equipmentMatch[1]) : null;

  async function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !query.trim()) return;
    setSearchError(false);
    const res = await fetch(`/api/equipment/lookup?q=${encodeURIComponent(query.trim())}`);
    const { match } = await res.json();
    if (match) {
      setQuery("");
      router.push(`/equipment/${match}`);
    } else {
      setSearchError(true);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-maroon-800 bg-maroon-900 text-white shadow-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Gauge className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold sm:text-lg">UES Reliability Dashboard</h1>
            <p className="text-[11px] text-maroon-200 sm:text-xs">Texas A&amp;M University · Utilities &amp; Energy Services</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex ${searchError ? "border-red-300 bg-red-500/10" : "border-white/20 bg-white/10"}`}>
            <Search className="h-3.5 w-3.5 text-maroon-200" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchError(false);
              }}
              onKeyDown={handleSearch}
              placeholder="Jump to asset, e.g. CHLR003"
              className="w-44 bg-transparent text-sm text-white placeholder:text-maroon-200/70 focus:outline-none"
            />
          </div>

          {canLogIssue && (
            <button type="button" onClick={() => setShowLogModal(true)} className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-semibold text-maroon-900 transition hover:bg-maroon-50">
              + Log new issue
            </button>
          )}

          <span className="hidden text-sm text-maroon-100 md:inline">{userName}</span>

          <form action={signOutAction}>
            <button type="submit" title="Sign out" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-maroon-100 transition hover:bg-white/10">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>

      {showLogModal && <LogIssueModal onClose={() => setShowLogModal(false)} equipmentList={equipmentList} presetAssetId={currentAssetId} />}
    </header>
  );
}
