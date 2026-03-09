"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function AlertsPage() {
  const { state } = useRiskEngine();
  const alerts = state.alerts;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Alerts</h1>
          <p className="text-xs text-slate-400">
            Triggered rules awaiting triage or investigation.
          </p>
        </div>
        <Badge variant="outline">
          {alerts.filter((a) => a.status === "Open").length} active
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Alert ID</TH>
              <TH>Rule</TH>
              <TH>Player</TH>
              <TH>Severity</TH>
              <TH>Timestamp</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {alerts.map((a) => {
              const player = state.players[a.playerId];
              return (
                <TR key={a.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {a.id}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {a.ruleTriggered}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {player ? `${player.name} (${a.playerId})` : a.playerId}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        a.severity === "Critical"
                          ? "danger"
                          : a.severity === "High" || a.severity === "Sportsbook"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        a.status === "Closed"
                          ? "success"
                          : a.status === "Open"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {a.status}
                    </Badge>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

