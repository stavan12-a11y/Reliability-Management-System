import { Home, MapPin, Box, AlertTriangle, History, BarChart3 } from "lucide-react";

export const NAV = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/equipment", label: "Equipment", icon: Box },
  { href: "/issues", label: "Active issues", icon: AlertTriangle },
  { href: "/history", label: "Issue history", icon: History },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;
