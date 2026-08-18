"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export function PageNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 overflow-x-auto">
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
    </nav>
  );
}
