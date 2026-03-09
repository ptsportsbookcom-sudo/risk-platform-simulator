"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
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
  { label: "Affordability Breach", engineType: "cdd_threshold_breach" },
];

const SAMPLE_COUNTRIES = ["UK", "DE", "SE", "FI", "NO", "IE", "NL"];
const SAMPLE_DEVICES = ["iphone-12", "android-pixel-7", "macbook-pro", "ipad-air"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function buildSecurityMetadata(type: EngineEventType) {
  if (
    type === "login" ||
    type === "vpn_login" ||
    type === "multi_device_login"
  ) {
    const deviceId = randomChoice(SAMPLE_DEVICES);
    const vpnDetected = type === "vpn_login";
    return {
      ipAddress: randomIp(),
      country: randomChoice(SAMPLE_COUNTRIES),
      deviceId,
      vpnDetected,
    };
  }
  if (
    type === "place_bet" ||
    type === "large_bet" ||
    type === "suspicious_bet"
  ) {
    const deviceId = randomChoice(SAMPLE_DEVICES);
    return {
      ipAddress: randomIp(),
      country: randomChoice(SAMPLE_COUNTRIES),
      deviceId,
      // simple sportsbook context
      eventName: "Champions League Final",
      market: "Match Winner",
      odds: Number((1.5 + Math.random() * 3).toFixed(2)),
    };
  }
  return undefined;
}

function formatEventType(type: EngineEventType) {
  return type
    .split("_")
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

export default function SimulatorPage() {
  const { state, processSimulatorEvent } = useRiskEngine();
  const events = state.events;

  function triggerEvent(button: ButtonConfig) {
    const metadata = buildSecurityMetadata(button.engineType);
    const amount =
      button.engineType === "deposit"
        ? Math.floor(500 + Math.random() * 2000)
        : button.engineType === "place_bet" ||
            button.engineType === "large_bet" ||
            button.engineType === "suspicious_bet"
          ? Math.floor(50 + Math.random() * 950)
          : undefined;
    processSimulatorEvent({
      playerId: DEFAULT_PLAYER_ID,
      eventType: button.engineType,
      metadata,
      amount,
    });
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
        description="Chronological stream of simulator events and triggered rules."
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
                <TH>Rules</TH>
              </TR>
            </THead>
            <TBody>
              {events.map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {e.id}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {formatEventType(e.eventType)}
                  </TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </TD>
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

