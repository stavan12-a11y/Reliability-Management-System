import type { CSSProperties } from "react";

// Color tokens carried over directly from prototype.jsx (BUILD_SPEC.md section 6).
export const colors = {
  bg: "#0a0d12",
  bgPanel: "#0d1117",
  bgCard: "#161b22",
  bgCardAlt: "#12171f",
  bgRow: "#0f1319",
  border: "#232a35",
  borderSubtle: "#1d232d",
  borderFaint: "#1e2530",
  text: "#e6e9ee",
  textMuted: "#c9d1d9",
  textDim: "#9aa4b2",
  textFaint: "#8892a0",
  textGhost: "#6b7280",
  textGhostDark: "#4a5261",
  accent: "#7cc4f0",
  accentBg: "#1d4e6f",
  accentBorder: "#2c6890",
  danger: "#e24b4a",
  dangerBg: "rgba(226,75,74,0.12)",
  warn: "#ba7517",
  warnBg: "rgba(186,117,23,0.14)",
  ok: "#5f9c2a",
  okBg: "rgba(95,156,42,0.12)",
  medium: "#c9a227",
} as const;

export const statusMeta = {
  unavailable: { label: "Unavailable", color: colors.danger, bg: colors.dangerBg },
  limited: { label: "Limited", color: colors.warn, bg: colors.warnBg },
  available: { label: "Available", color: "#3b6d11", bg: "rgba(59,109,17,0.12)" },
} as const;

export type StatusKey = keyof typeof statusMeta;

export function criticalityTier(score: number) {
  if (score >= 17) return { label: "Critical", color: colors.danger };
  if (score >= 10) return { label: "High", color: colors.warn };
  if (score >= 5) return { label: "Medium", color: colors.medium };
  return { label: "Low", color: colors.ok };
}

export function availabilityColor(pct: number | null | undefined) {
  if (pct == null) return colors.textGhost;
  if (pct >= 97) return colors.ok;
  if (pct >= 90) return colors.warn;
  return colors.danger;
}

export const fieldInputStyle: CSSProperties = {
  width: "100%",
  background: "#0a0d12",
  border: `1px solid ${colors.border}`,
  borderRadius: 7,
  padding: "8px 10px",
  color: colors.text,
  fontSize: 13,
  boxSizing: "border-box",
};

export const fieldLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  color: colors.textFaint,
  marginBottom: 5,
  fontWeight: 500,
};

export const selectStyle: CSSProperties = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: 7,
  color: colors.textMuted,
  fontSize: 13,
  padding: "0 10px",
  height: 34,
};
