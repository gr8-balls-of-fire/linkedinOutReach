"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/lists", label: "Lists & Drafts" },
  { href: "/pending", label: "Pending Queue" },
  { href: "/digest", label: "Response Digest" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const ping = () => fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    ping();
    const interval = setInterval(ping, 20_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white px-4 py-6">
        <div className="mb-8 px-2">
          <div className="text-lg font-semibold text-brand-700">Spexsure Outreach</div>
          <div className="text-xs text-gray-400">LinkedIn prospecting engine</div>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
