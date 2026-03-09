"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import type { Event } from "@/types/event";

type ButtonConfig = {
  label: string;
  category: Event["category"];
};

const playerEvents: ButtonConfig[] = [
  { label: "Create Player", category: "Player" },
  { label: "Login", category: "Player" },
  { label: "Deposit", category: "Player" },
  { label: "Withdraw", category: "Player" },
  { label: "Claim Bonus", category: "Player" },
  { label: "Casino Session", category: "Player" },
];

const sportsbookEvents: ButtonConfig[] = [
  { label: "Place Bet", category: "Sportsbook" },
  { label: "Large Bet", category: "Sportsbook" },
  { label: "Suspicious Bet", category: "Sportsbook" },
];

const fraudEvents: ButtonConfig[] = [
  { label: "Chargeback", category: "Fraud" },
  { label: "VPN Login", category: "Fraud" },
  { label: "Multi Device Login", category: "Fraud" },
];

const complianceEvents: ButtonConfig[] = [
  { label: "KYC Failure", category: "Compliance" },
  { label: "CDD Threshold Breach", category: "Compliance" },
  { label: "Affordability Breach", category: "Compliance" },
];

export default function SimulatorPage() {
  const [events, setEvents] = useState<Event[]>([]);

  function triggerEvent(button: ButtonConfig) {
    const now = new Date();
    const newEvent: Event = {
      id: `EV-${(events.length + 1).toString().padStart(4, "0")}`,
      category: button.category,
      type: button.label,
      createdAt: now.toISOString(),
      meta: "Simulated event fired from control panel",
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50));
  }

  function renderButtons(groupTitle: string, buttons: ButtonConfig[]) {
    return (
      <Card title={groupTitle}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {buttons.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => triggerEvent(b)}
              className="rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-left text-slate-100 transition hover:border-emerald-500/60 hover:bg-slate-900"
            >
              {b.label}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Simulator</h1>
          <p className="text-xs text-slate-400">
            Fire synthetic events into the risk platform simulator and observe
            the live log.
          </p>
        </div>
        <Badge variant="outline">
          {events.length === 0
            ? "No events yet"
            : `${events.length} events in current run`}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {renderButtons("Player Events", playerEvents)}
        {renderButtons("Sportsbook Events", sportsbookEvents)}
        {renderButtons("Fraud Events", fraudEvents)}
        {renderButtons("Compliance Events", complianceEvents)}
      </div>

      <Card
        title="Live Event Log"
        description="Chronological stream of simulator events (most recent first)."
      >
        {events.length === 0 ? (
          <p className="text-xs text-slate-400">
            Trigger any event above to start populating the log.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Event ID</TH>
                <TH>Category</TH>
                <TH>Type</TH>
                <TH>Timestamp</TH>
                <TH>Meta</TH>
              </TR>
            </THead>
            <TBody>
              {events.map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {e.id}
                  </TD>
                  <TD>
                    <Badge variant="outline">{e.category}</Badge>
                  </TD>
                  <TD className="text-xs text-slate-100">{e.type}</TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.createdAt).toLocaleTimeString()}
                  </TD>
                  <TD className="text-[11px] text-slate-400">{e.meta}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

