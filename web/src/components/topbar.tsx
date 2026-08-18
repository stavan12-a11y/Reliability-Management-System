"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { colors } from "@/lib/theme";
import { NAV } from "@/lib/nav";
import { LogIssueModal } from "./log-issue-modal";
import { signOutAction } from "@/lib/actions/auth-signout";

type PickerAsset = { id: string; assetNumber: string; manufacturer: string; model: string; locationId: string; critScore: number };

export function Topbar({
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

  const pageTitle = NAV.find((n) => pathname === n.href || (n.href === "/equipment" && pathname.startsWith("/equipment/")))?.label ?? "";
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px", borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: colors.text }}>{pageTitle}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.bgCard, border: `1px solid ${searchError ? colors.danger : colors.border}`, borderRadius: 7, padding: "0 10px", height: 32, width: 220 }}>
          <Search size={13} color={colors.textGhost} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchError(false); }}
            onKeyDown={handleSearch}
            placeholder="Jump to asset, e.g. CHLR003"
            style={{ background: "transparent", border: "none", outline: "none", color: colors.text, fontSize: 12.5, width: "100%" }}
          />
        </div>
        {canLogIssue && (
          <button
            onClick={() => setShowLogModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 32, borderRadius: 7, background: colors.accent, border: `1px solid ${colors.accent}`, color: "#0a0d12", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Log new issue
          </button>
        )}
        <span style={{ fontSize: 12, color: colors.textGhost, whiteSpace: "nowrap" }}>{userName}</span>
        <form action={signOutAction}>
          <button type="submit" title="Sign out" style={{ display: "flex", alignItems: "center", background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 6, width: 30, height: 30, justifyContent: "center", cursor: "pointer" }}>
            <LogOut size={13} color={colors.textGhost} />
          </button>
        </form>
      </div>

      {showLogModal && (
        <LogIssueModal onClose={() => setShowLogModal(false)} equipmentList={equipmentList} presetAssetId={currentAssetId} />
      )}
    </div>
  );
}
