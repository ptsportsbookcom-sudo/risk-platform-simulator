"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

function formatEventType(type: string) {
  return type
    .split("_")
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

export function SecuritySignals({ playerId }: { playerId: string }) {
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

  const securityEvents = events.filter(
    (e) =>
      ["login", "vpn_login", "multi_device_login"].includes(e.eventType) ||
      e.metadata,
  );

  return (
    <Card
      title="Security Signals"
      description="Device and IP intelligence associated with this player."
    >
      {securityEvents.length === 0 ? (
        <p className="text-xs text-slate-400">
          No security-related events recorded for this player yet.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Timestamp</TH>
              <TH>Event</TH>
              <TH>IP Address</TH>
              <TH>Country</TH>
              <TH>Device ID</TH>
              <TH>VPN Detected</TH>
            </TR>
          </THead>
          <TBody>
            {securityEvents.map((e) => {
              const meta = e.metadata as {
                ipAddress?: string;
                country?: string;
                deviceId?: string;
                vpnDetected?: boolean;
              } | null;
              return (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.timestamp).toLocaleString()}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {formatEventType(e.eventType)}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {meta?.ipAddress ?? "—"}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {meta?.country ?? "—"}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {meta?.deviceId ?? "—"}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {meta?.vpnDetected ? "Yes" : "No"}
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

