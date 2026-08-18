import { Flame, Snowflake, Droplet, Gauge } from "lucide-react";
import { SYSTEM_ICON_KEYS } from "./system-icon-keys";

export const SYSTEM_ICONS: Record<(typeof SYSTEM_ICON_KEYS)[number], typeof Flame> = {
  flame: Flame,
  snowflake: Snowflake,
  droplet: Droplet,
  gauge: Gauge,
};

export function systemIcon(key: string) {
  return SYSTEM_ICONS[key as (typeof SYSTEM_ICON_KEYS)[number]] ?? Gauge;
}
