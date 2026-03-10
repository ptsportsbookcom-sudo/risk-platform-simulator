"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function HighRiskBetsPage() {
  const { state, approveHighRiskBet, rejectHighRiskBet, modifyHighRiskBet } =
    useRiskEngine();
  const bets = state.highRiskBets;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStake, setEditStake] = useState<string>("");
  const [editOdds, setEditOdds] = useState<string>("");

  const pendingCount = bets.filter((b) => b.status === "pending").length;

  function openModify(betId: string) {
    const bet = bets.find((b) => b.id === betId);
    if (!bet) return;
    setEditingId(betId);
    setEditStake(String(bet.stake));
    setEditOdds(String(bet.odds));
    setIsModalOpen(true);
  }

  function handleSaveModify() {
    if (!editingId) return;
    modifyHighRiskBet(editingId, {
      stake: Number(editStake) || 0,
      odds: Number(editOdds) || 1,
    });
    setIsModalOpen(false);
    setEditingId(null);
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            High Risk Bets
          </h1>
          <p className="text-xs text-slate-400">
            Bets exceeding configured trading risk thresholds and awaiting
            manual trader review.
          </p>
        </div>
        <Badge variant="outline">{pendingCount} bets pending review</Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Bet ID</TH>
              <TH>Player</TH>
              <TH>Event</TH>
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
                  <TD className="text-xs text-slate-200">{b.eventName}</TD>
                  <TD className="text-xs text-slate-200">{b.market}</TD>
                  <TD className="text-xs text-slate-200">
                    €{b.stake.toLocaleString()}
                  </TD>
                  <TD className="text-xs text-slate-200">{b.odds}</TD>
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
                            : b.status === "modified"
                              ? "outline"
                              : "danger"
                      }
                    >
                      {b.status}
                    </Badge>
                  </TD>
                  <TD className="text-[11px] text-slate-200">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => approveHighRiskBet(b.id)}
                        className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectHighRiskBet(b.id)}
                        className="rounded-md border border-red-600 bg-red-600/10 px-2 py-0.5 text-red-200 hover:bg-red-600/20"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => openModify(b.id)}
                        className="rounded-md border border-sky-600 bg-sky-600/10 px-2 py-0.5 text-sky-200 hover:bg-sky-600/20"
                      >
                        Modify
                      </button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      {isModalOpen && editingId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-black/60">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">
                Modify Bet
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-200">
              <div className="space-y-1">
                <label className="block text-slate-300">Stake</label>
                <input
                  type="number"
                  value={editStake}
                  onChange={(e) => setEditStake(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300">Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={editOdds}
                  onChange={(e) => setEditOdds(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModify}
                  className="rounded-md border border-emerald-500/70 bg-emerald-500/20 px-3 py-1 font-medium text-emerald-100 hover:bg-emerald-500/30"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

