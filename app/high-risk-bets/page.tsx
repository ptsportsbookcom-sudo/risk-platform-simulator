"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function HighRiskBetsPage() {
  const { state, updateHighRiskBet } = useRiskEngine();
  const bets = state.highRiskBets;

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
          {bets.filter((b) => b.status === "pending").length} bets pending review
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Bet ID</TH>
              <TH>Player</TH>
              <TH>Market</TH>
              <TH>Stake</TH>
              <TH>Odds</TH>
              <TH>Possible Payout</TH>
              <TH>Reason</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
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
                  <TD className="text-xs text-slate-200">{b.market}</TD>
                  <TD className="text-xs text-slate-200">
                    <input
                      type="number"
                      className="w-20 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[11px] text-slate-100"
                      defaultValue={b.stake}
                      onBlur={(e) =>
                        updateHighRiskBet(b.id, {
                          stake: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </TD>
                  <TD className="text-xs text-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[11px] text-slate-100"
                      defaultValue={b.odds}
                      onBlur={(e) =>
                        updateHighRiskBet(b.id, {
                          odds: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </TD>
                  <TD className="text-xs text-slate-200">
                    €{b.possiblePayout.toLocaleString()}
                  </TD>
                  <TD className="text-[11px] text-slate-400">{b.reason}</TD>
                  <TD className="text-[11px] text-slate-200">
                    <Badge
                      variant={
                        b.status === "pending"
                          ? "warning"
                          : b.status === "approved"
                            ? "success"
                            : "danger"
                      }
                    >
                      {b.status}
                    </Badge>
                  </TD>
                  <TD className="text-[11px] text-slate-200">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateHighRiskBet(b.id, { status: "approved" })
                        }
                        className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateHighRiskBet(b.id, { status: "rejected" })
                        }
                        className="rounded-md border border-red-600 bg-red-600/10 px-2 py-0.5 text-red-200 hover:bg-red-600/20"
                      >
                        Reject
                      </button>
                    </div>
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

