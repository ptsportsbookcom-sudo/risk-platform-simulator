"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import type {
  EngineEventType,
  ProcessEventResult,
  RuleAction,
} from "@/modules/risk-engine";

type ButtonConfig = {
  label: string;
  engineType: EngineEventType;
};

type SimulatorLogRow = {
  eventId: string;
  eventType: EngineEventType;
  timestamp: string;
  triggeredRules: { id: string; name: string }[];
  actions: RuleAction[];
  alertCreated: boolean;
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
  { label: "Suspicious Bet", engineType: "suspicious_bet" },
];

const fraudEvents: ButtonConfig[] = [
  { label: "Chargeback", engineType: "chargeback" },
  { label: "VPN Login", engineType: "vpn_login" },
  { label: "Multi Device Login", engineType: "multi_device_login" },
];

const complianceEvents: ButtonConfig[] = [
  { label: "KYC Failure", engineType: "kyc_failure" },
  { label: "CDD Threshold Breach", engineType: "cdd_threshold_breach" },
];

function randomIp() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function formatEventType(type: EngineEventType) {
  return type
    .split("_")
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

function formatActionType(type: RuleAction["type"]) {
  return type
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

export default function SimulatorPage() {
  const { state, processSimulatorEvent } = useRiskEngine();
  const [lastResult, setLastResult] = useState<ProcessEventResult | null>(null);
  const [logRows, setLogRows] = useState<SimulatorLogRow[]>([]);
  const [customType, setCustomType] = useState<EngineEventType>("deposit");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customCurrency, setCustomCurrency] = useState<string>("EUR");
  const [customCountry, setCustomCountry] = useState<string>("UK");
  const [customDevice, setCustomDevice] = useState<string>("desktop");
  const [customIp, setCustomIp] = useState<string>(randomIp());

  function triggerEvent(button: ButtonConfig) {
    let amount: number | undefined;
    switch (button.engineType) {
      case "deposit":
        amount = 200;
        break;
      case "withdraw":
        amount = 100;
        break;
      case "place_bet":
        amount = 50;
        break;
      case "large_bet":
        amount = 5000;
        break;
      default:
        amount = undefined;
        break;
    }

    const device = button.engineType === "vpn_login" ? "vpn" : "desktop";
    const uiEvent = {
      id: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerId: DEFAULT_PLAYER_ID,
      type: button.engineType,
      amount,
      currency: "EUR" as const,
      country: "UK" as const,
      device,
      ip: randomIp(),
      timestamp: Date.now(),
    };

    const result = processSimulatorEvent({
      playerId: uiEvent.playerId,
      eventType: button.engineType,
      amount: uiEvent.amount,
      metadata: {
        currency: uiEvent.currency,
        country: uiEvent.country,
        device: uiEvent.device,
        ipAddress: uiEvent.ip,
        simulatorEventId: uiEvent.id,
        simulatorTimestamp: uiEvent.timestamp,
      },
    });

    const engineEvents = result.state.events;
    const engineLogEntry = engineEvents[engineEvents.length - 1];

    if (engineLogEntry) {
      const triggeredRules = result.triggeredRules.map((re) => {
        const rule = result.state.rules.find((r) => r.id === re.ruleId);
        return {
          id: re.ruleId,
          name: rule?.name ?? re.description,
        };
      });

      const row: SimulatorLogRow = {
        eventId: engineLogEntry.id,
        eventType: engineLogEntry.eventType,
        timestamp: engineLogEntry.timestamp,
        triggeredRules,
        actions: result.actions,
        alertCreated: result.newAlerts.length > 0,
      };

      setLogRows((prev) => [row, ...prev]);
    }

    setLastResult(result);
  }

  function runCustomEvent() {
    const amount =
      customAmount.trim().length > 0 ? Number(customAmount.trim()) : undefined;

    const uiEvent = {
      id: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerId: DEFAULT_PLAYER_ID,
      type: customType,
      amount,
      currency: customCurrency || "EUR",
      country: customCountry || "UK",
      device: customDevice || "desktop",
      ip: customIp || randomIp(),
      timestamp: Date.now(),
    };

    const result = processSimulatorEvent({
      playerId: uiEvent.playerId,
      eventType: uiEvent.type,
      amount: uiEvent.amount,
      metadata: {
        currency: uiEvent.currency,
        country: uiEvent.country,
        device: uiEvent.device,
        ipAddress: uiEvent.ip,
        simulatorEventId: uiEvent.id,
        simulatorTimestamp: uiEvent.timestamp,
      },
    });

    const engineEvents = result.state.events;
    const engineLogEntry = engineEvents[engineEvents.length - 1];

    if (engineLogEntry) {
      const triggeredRules = result.triggeredRules.map((re) => {
        const rule = result.state.rules.find((r) => r.id === re.ruleId);
        return {
          id: re.ruleId,
          name: rule?.name ?? re.description,
        };
      });

      const row: SimulatorLogRow = {
        eventId: engineLogEntry.id,
        eventType: engineLogEntry.eventType,
        timestamp: engineLogEntry.timestamp,
        triggeredRules,
        actions: result.actions,
        alertCreated: result.newAlerts.length > 0,
      };

      setLogRows((prev) => [row, ...prev]);
    }

    setLastResult(result);
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
          {state.events.length === 0
            ? "No events yet"
            : `${state.events.length} events in current run`}
        </Badge>
      </div>

      <Card title="Custom Event Builder">
        <div className="grid gap-3 text-xs md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Event Type</label>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customType}
              onChange={(e) => setCustomType(e.target.value as EngineEventType)}
            >
              <option value="deposit">deposit</option>
              <option value="withdraw">withdraw</option>
              <option value="bet">bet</option>
              <option value="login">login</option>
              <option value="chargeback">chargeback</option>
              <option value="bonus_claim">bonus_claim</option>
              <option value="casino_session">casino_session</option>
              <option value="kyc_failure">kyc_failure</option>
              <option value="cdd_threshold_breach">cdd_threshold_breach</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Amount</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Currency</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
              placeholder="e.g. EUR"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Country</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customCountry}
              onChange={(e) => setCustomCountry(e.target.value)}
              placeholder="e.g. UK"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">Device</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customDevice}
              onChange={(e) => setCustomDevice(e.target.value)}
              placeholder="e.g. desktop"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400">IP Address</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="e.g. 192.168.0.1"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={runCustomEvent}
            className="rounded-md border border-emerald-600 bg-emerald-600/10 px-3 py-1 text-[11px] text-emerald-100 hover:bg-emerald-600/20"
          >
            Run Custom Event
          </button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {renderButtons("Player Events", playerEvents)}
        {renderButtons("Sportsbook Events", sportsbookEvents)}
        {renderButtons("Fraud Events", fraudEvents)}
        {renderButtons("Compliance Events", complianceEvents)}
      </div>

      <Card
        title="Live Event Log"
        description="Chronological stream of simulator events and triggered rules."
      >
        {logRows.length === 0 ? (
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
                <TH>Triggered Rules</TH>
                <TH>Actions Executed</TH>
                <TH>Alert Created</TH>
              </TR>
            </THead>
            <TBody>
              {logRows.map((row) => (
                <TR key={row.eventId}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {row.eventId}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {formatEventType(row.eventType)}
                  </TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </TD>
                  <TD className="text-[11px] text-slate-400">
                    {row.triggeredRules.length === 0 ? (
                      "—"
                    ) : (
                      <div className="space-y-0.5">
                        {row.triggeredRules.map((r) => (
                          <div key={r.id}>
                            {r.name}{" "}
                            <span className="font-mono text-[10px] text-slate-500">
                              ({r.id})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TD>
                  <TD className="text-[11px] text-slate-400">
                    {row.actions.length === 0 ? (
                      "—"
                    ) : (
                      <div className="space-y-0.5">
                        {row.actions.map((a, idx) => (
                          <div key={`${row.eventId}-action-${idx}`}>
                            {formatActionType(a.type)}
                          </div>
                        ))}
                      </div>
                    )}
                  </TD>
                  <TD className="text-[11px] text-slate-400">
                    {row.alertCreated ? "YES" : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card
        title="Triggered Rules"
        description="Rule execution details for the most recent simulated event."
      >
        {!lastResult ? (
          <p className="text-xs text-slate-400">
            Trigger an event above to see which rules executed and what actions
            they performed.
          </p>
        ) : lastResult.triggeredRules.length === 0 ? (
          <p className="text-xs text-slate-400">
            No rules were triggered for the last simulated event.
          </p>
        ) : (
          <div className="space-y-4 text-xs">
            {lastResult.triggeredRules.map((ruleEval, idx) => {
              const actions = ruleEval.actions ?? [];
              return (
                <div
                  key={`${ruleEval.ruleId}-${idx}`}
                  className="rounded-md border border-slate-700 bg-slate-900/60 p-3"
                >
                  <div className="mb-1 font-medium text-slate-100">
                    Rule: {ruleEval.description}
                  </div>
                  <div className="mb-1 text-[11px] text-slate-300">
                    Severity: {(ruleEval.alertSeverity ?? "Medium").toLowerCase()}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Actions:
                    {actions.length === 0 ? (
                      <span className="ml-1 text-slate-500">None</span>
                    ) : (
                      <ul className="mt-1 list-disc pl-5">
                        {actions.map((action, i) => (
                          <li key={`${ruleEval.ruleId}-action-${i}`}>
                            {formatActionType(action.type)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

