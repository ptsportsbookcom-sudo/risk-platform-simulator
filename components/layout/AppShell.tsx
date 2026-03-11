"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RiskEngineProvider } from "@/components/risk/RiskEngineContext";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Players", href: "/players" },
  { label: "Segments", href: "/segments" },
  { label: "Alerts", href: "/alerts" },
  { label: "Cases", href: "/cases" },
  { label: "Rules", href: "/rules" },
  { label: "High Risk Bets", href: "/high-risk-bets" },
  { label: "Casino Risk", href: "/casino-risk" },
  { label: "Sports Risk", href: "/sports-risk" },
  { label: "KYC / CDD", href: "/kyc-cdd" },
  { label: "Bulk Actions", href: "/bulk-actions" },
  { label: "Reports", href: "/reports" },
  { label: "Audit Log", href: "/audit-log" },
  { label: "Simulator", href: "/simulator" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950/60 px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-slate-950">
            RP
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">
              Risk Platform
            </div>
            <div className="text-xs text-slate-400">Fraud &amp; Compliance</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-md px-2.5 py-2 transition-colors ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-50"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-500">
          Internal simulator &bull; Not connected to production data
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              iGaming Risk Backoffice
            </span>
            <span className="text-sm text-slate-200">
              Internal Risk &amp; Fraud Management Simulator
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Environment: Sandbox</span>
            </div>
            <div className="hidden items-center gap-2 text-slate-300 sm:flex">
              <span className="h-7 w-7 rounded-full bg-slate-800" />
              <span>risk.analyst@operator.io</span>
            </div>
          </div>
        </header>

        <RiskEngineProvider>
          <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-6 lg:px-6">
            <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
              {children}
            </div>
          </main>
        </RiskEngineProvider>
      </div>
    </div>
  );
}

