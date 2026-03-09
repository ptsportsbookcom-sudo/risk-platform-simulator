"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import type { Event } from "@/types/event";
import type { EngineEventType } from "@/modules/risk-engine";

type ButtonConfig = {
  label: string;
  engineType: EngineEventType;
};

const DEFAULT_PLAYER_ID = "P-102938";

const playerEvents: ButtonConfig[] = [
  { label: "Create Player", engineType: "player_created" },
  { label: "Login", engineType: "login" },
  { label: "Deposit", engineType: "deposit" },
  { label: "Withdraw", engineType: "withdraw" },
  { label: "Claim Bonus", engineType: "bonus_claim" },
  { label: "Casino Session", engineType: "casino_session" },
];

const sportsbookEvents: ButtonConfig[] = [
  { label: "Place Bet", engineType: "place_bet" },
  { label: "Large Bet", engineType: "large_bet" },
  { label: "Suspicious Bet", engineType: "large_bet" },
];

const fraudEvents: ButtonConfig[] = [
  { label: "Chargeback", engineType: "chargeback" },
  { label: "VPN Login", engineType: "vpn_login" },
  { label: "Multi Device Login", engineType: "multi_device_login" },
];

const complianceEvents: ButtonConfig[] = [
  { label: "KYC Failure", engineType: "kyc_failure" },
  { label: "CDD Threshold Breach", engineType: "cdd_threshold_breach" },
  { label: "Affordability Breach", engineType: "cdd_threshold_breach" },
];

type LoggedEvent = Event & {
  riskDelta: number;
  newScore: number;
  triggeredRules: string[];
};

export default function SimulatorPage() {
  const { processSimulatorEvent } = useRiskEngine();
  const [events, setEvents] = useState<LoggedEvent[]>([]);

  function triggerEvent(button: ButtonConfig) {
    const result = processSimulatorEvent({
      playerId: DEFAULT_PLAYER_ID,
      eventType: button.engineType,
    });

    const now = new Date(result.newScore ? Date.now() : Date.now());

    const logEvent: LoggedEvent = {
      id: `EV-${(events.length + 1).toString().padStart(4, "0")}`,
      category:
        button.engineType === "place_bet" ||
        button.engineType === "large_bet"
          ? "Sportsbook"
          : button.engineType === "vpn_login" ||
              button.engineType === "multi_device_login" ||
              button.engineType === "chargeback"
            ? "Fraud"
            : button.engineType === "kyc_failure" ||
                button.engineType === "cdd_threshold_breach"
              ? "Compliance"
              : "Player",
      type: button.label,
      createdAt: now.toISOString(),
      meta: "Simulated event fired from control panel",
      riskDelta: result.newScore - result.previousScore,
      newScore: result.newScore,
      triggeredRules: result.triggeredRules.map((r) => r.ruleId),
    };

    setEvents((prev) => [logEvent, ...prev].slice(0, 50));
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
            the live log and risk engine reaction.
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
        description="Chronological stream of simulator events and resulting risk scores."
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
                <TH>Type</TH>
                <TH>Timestamp</TH>
                <TH>Δ Risk</TH>
                <TH>New Score</TH>
                <TH>Rules</TH>
              </TR>
            </THead>
            <TBody>
              {events.map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {e.id}
                  </TD>
                  <TD className="text-xs text-slate-100">{e.type}</TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.createdAt).toLocaleTimeString()}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {e.riskDelta >= 0 ? `+${e.riskDelta}` : e.riskDelta}
                  </TD>
                  <TD className="text-xs text-slate-200">{e.newScore}</TD>
                  <TD className="text-[11px] text-slate-400">
                    {e.triggeredRules.length === 0
                      ? "—"
                      : e.triggeredRules.join(", ")}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

