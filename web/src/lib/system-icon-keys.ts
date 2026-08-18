// Plain data (no React/lucide import) so it can be shared with Node scripts
// like prisma/import-equipment.ts without pulling in a UI dependency.
export const SYSTEM_ICON_KEYS = ["flame", "snowflake", "droplet", "gauge"] as const;
