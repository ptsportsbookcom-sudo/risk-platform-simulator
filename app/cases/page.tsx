"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function CasesPage() {
  const { state } = useRiskEngine();
  const cases = state.cases;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Cases</h1>
          <p className="text-xs text-slate-400">
            Investigation cases created from alerts and rule escalations.
          </p>
        </div>
        <Badge variant="outline">
          {cases.filter((c) => c.status === "Open").length} open
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Case ID</TH>
              <TH>Player</TH>
              <TH>Status</TH>
              <TH>Alerts</TH>
              <TH>Opened</TH>
            </TR>
          </THead>
          <TBody>
            {cases.map((c) => {
              const player = state.players[c.playerId];
              return (
                <TR key={c.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {c.id}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {player ? `${player.name} (${c.playerId})` : c.playerId}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        c.status === "Closed"
                          ? "success"
                          : c.status === "Open"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {c.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {c.alerts.length}
                  </TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(c.openedAt).toLocaleString()}
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

