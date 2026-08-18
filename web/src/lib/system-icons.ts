import { Flame, Snowflake, Droplet, Gauge } from "lucide-react";

export const SYSTEM_ICONS: Record<string, typeof Flame> = {
  flame: Flame,
  snowflake: Snowflake,
  droplet: Droplet,
  gauge: Gauge,
};

export function systemIcon(key: string) {
  return SYSTEM_ICONS[key] ?? Gauge;
}
