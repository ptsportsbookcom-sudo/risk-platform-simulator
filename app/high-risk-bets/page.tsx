"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function HighRiskBetsPage() {
  const { state } = useRiskEngine();
  const bets = state.bets;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            High Risk Bets
          </h1>
          <p className="text-xs text-slate-400">
            Bets and sessions exceeding configured risk thresholds.
          </p>
        </div>
        <Badge variant="outline">
          {bets.length} bets flagged by sportsbook rules
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Bet ID</TH>
              <TH>Player</TH>
              <TH>Type</TH>
              <TH>Amount</TH>
              <TH>Timestamp</TH>
            </TR>
          </THead>
          <TBody>
            {bets.map((b) => {
              const player = state.players[b.playerId];
              return (
                <TR key={b.id}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    {b.id}
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {player ? `${player.name} (${b.playerId})` : b.playerId}
                  </TD>
                  <TD>
                    <Badge variant="outline">Large Bet</Badge>
                  </TD>
                  <TD className="text-xs text-slate-200">
                    {b.amount != null ? `€${b.amount.toLocaleString()}` : "—"}
                  </TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(b.timestamp).toLocaleString()}
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

