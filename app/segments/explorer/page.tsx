"use client";

import { useState } from "react";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

export default function SegmentExplorerPage() {
  const { state } = useRiskEngine();

  const segments = state.segments ?? [];
  const players = Object.values(state.players ?? {});
  const alerts = state.alerts ?? [];

  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(
    segments[0]?.id ?? "",
  );

  const selectedSegment =
    segments.find((s) => s.id === selectedSegmentId) ?? segments[0] ?? null;

  const playersInSegment =
    selectedSegment == null
      ? []
      : players.filter((p) => (p.segments ?? []).includes(selectedSegment.id));

  const playerIds = new Set(playersInSegment.map((p) => p.playerId));

  const segmentAlerts = alerts.filter((a) => playerIds.has(a.playerId));

  const totalDeposits = playersInSegment.reduce((sum, p) => {
    const m = p.metrics as any;
    return sum + ((m?.total_deposit_amount as number | undefined) ?? 0);
  }, 0);

  const totalWithdrawals = playersInSegment.reduce((sum, p) => {
    const m = p.metrics as any;
    return sum + ((m?.total_withdrawal_amount as number | undefined) ?? 0);
  }, 0);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Segment Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Inspect players and alerts associated with a specific segment.
          </p>
        </div>
        <Badge variant="outline">
          {segments.length} segments / {players.length} players
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
        <Card title="Segment Selector">
          {segments.length === 0 ? (
            <p className="text-xs text-slate-400">
              No segments configured yet. Create segments first to explore their
              performance.
            </p>
          ) : (
            <div className="space-y-3 text-xs text-slate-200">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Select Segment
                </label>
                <select
                  value={selectedSegment?.id ?? ""}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
                >
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name} ({seg.id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSegment && (
                <div className="space-y-1 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] font-semibold text-slate-100">
                    Segment Details
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ID</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {selectedSegment.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Name</span>
                    <span>{selectedSegment.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Domain</span>
                    <span className="text-[11px] text-slate-300">
                      {selectedSegment.domain ?? "—"}
                    </span>
                  </div>
                  {selectedSegment.description && (
                    <div className="pt-1 text-[11px] text-slate-300">
                      {selectedSegment.description}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-[11px] text-slate-400">
                    Players in Segment
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-50">
                    {playersInSegment.length}
                  </div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-[11px] text-slate-400">
                    Alerts for Segment
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-50">
                    {segmentAlerts.length}
                  </div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-[11px] text-slate-400">
                    Total Deposits
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-50">
                    €{totalDeposits.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <div className="text-[11px] text-slate-400">
                    Total Withdrawals
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-50">
                    €{totalWithdrawals.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card
            title="Players in Segment"
            description={
              playersInSegment.length === 0
                ? "No players are currently assigned to this segment."
                : "List of players currently assigned to this segment."
            }
          >
            {playersInSegment.length === 0 ? (
              <p className="text-xs text-slate-400">
                No players found for the selected segment.
              </p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Player ID</TH>
                    <TH>Name</TH>
                    <TH>Country</TH>
                    <TH>Alerts</TH>
                  </TR>
                </THead>
                <TBody>
                  {playersInSegment.map((p) => {
                    const playerAlertCount = alerts.filter(
                      (a) => a.playerId === p.playerId,
                    ).length;
                    return (
                      <TR key={p.playerId}>
                        <TD className="font-mono text-[11px] text-slate-300">
                          {p.playerId}
                        </TD>
                        <TD className="text-xs text-slate-100">{p.name}</TD>
                        <TD className="text-xs text-slate-200">{p.country}</TD>
                        <TD className="text-xs text-slate-200">
                          {playerAlertCount}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>

          <Card
            title="Alerts for Segment"
            description="Alerts generated on players in this segment."
          >
            {segmentAlerts.length === 0 ? (
              <p className="text-xs text-slate-400">
                No alerts generated yet for this segment.
              </p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Alert ID</TH>
                    <TH>Player</TH>
                    <TH>Rule</TH>
                    <TH>Severity</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {segmentAlerts.map((a) => {
                    const player = state.players[a.playerId];
                    const rule =
                      state.rules.find((r) => r.id === a.ruleTriggered) ??
                      state.rules.find((r) => r.name === a.ruleTriggered);
                    return (
                      <TR key={a.id}>
                        <TD className="font-mono text-[11px] text-slate-300">
                          {a.id}
                        </TD>
                        <TD className="text-xs text-slate-100">
                          {player ? `${player.name} (${a.playerId})` : a.playerId}
                        </TD>
                        <TD className="text-xs text-slate-100">
                          {rule?.name ?? a.ruleTriggered}
                        </TD>
                        <TD className="text-[11px] text-slate-200">
                          {a.severity}
                        </TD>
                        <TD className="text-[11px] text-slate-200">
                          {a.status}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

