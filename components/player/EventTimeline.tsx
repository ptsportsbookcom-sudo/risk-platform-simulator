"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

const RULE_LABELS: Record<string, string> = {
  R1_DEPOSIT_BEFORE_KYC: "Deposit Before KYC",
  R2_HIGH_DEPOSIT_VELOCITY: "High Deposit Velocity",
  R3_VPN_LOGIN: "VPN Login",
  R4_CHARGEBACK: "Chargeback",
  R5_LARGE_BET: "Large Bet",
};

function formatEventType(type: string) {
  return type
    .split("_")
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

function formatMetadata(meta?: Record<string, unknown>) {
  if (!meta || Object.keys(meta).length === 0) return "—";
  try {
    const json = JSON.stringify(meta);
    return json.length > 80 ? `${json.slice(0, 77)}...` : json;
  } catch {
    return "—";
  }
}

export function EventTimeline({ playerId }: { playerId: string }) {
  const { state } = useRiskEngine();

  const events = useMemo(
    () =>
      state.events
        .filter((e) => e.playerId === playerId)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
    [state.events, playerId],
  );

  return (
    <Card
      title="Event Timeline"
      description="Chronological history of all events and triggered rules."
    >
      {events.length === 0 ? (
        <p className="text-xs text-slate-400">
          No events for this player yet in the current simulation.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Time</TH>
              <TH>Event</TH>
              <TH>Risk Impact</TH>
              <TH>Triggered Rule</TH>
              <TH>Details</TH>
            </TR>
          </THead>
          <TBody>
            {events.map((e) => {
              const hasRules = e.triggeredRules.length > 0;
              const ruleLabels = e.triggeredRules.map(
                (id) => RULE_LABELS[id] ?? id,
              );

              return (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.timestamp).toLocaleString()}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {formatEventType(e.eventType)}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {hasRules ? ruleLabels.join(", ") : "—"}
                  </TD>
                  <TD className="text-[11px] text-slate-500">
                    {formatMetadata(e.metadata)}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

