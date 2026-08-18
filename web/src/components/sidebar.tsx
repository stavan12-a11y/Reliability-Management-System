"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge } from "lucide-react";
import { NAV } from "@/lib/nav";
import { colors } from "@/lib/theme";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div style={{ width: 200, flexShrink: 0, background: colors.bgPanel, borderRight: `1px solid ${colors.borderSubtle}`, padding: "18px 12px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", marginBottom: 22 }}>
        <Gauge size={18} color={colors.accent} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>UES Reliability</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href || (n.href === "/equipment" && pathname.startsWith("/equipment/"));
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 7,
                background: active ? "#1a212c" : "transparent",
                color: active ? colors.text : colors.textFaint,
              }}
            >
              <Icon size={15} />
              <span style={{ fontSize: 13.5 }}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "10px 8px", fontSize: 11, color: colors.textGhostDark }}>Maintenance data managed in AIM</div>
    </div>
  );
}
