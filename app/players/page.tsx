"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import Link from "next/link";
import { useState } from "react";

export default function PlayersPage() {
  const { state } = useRiskEngine();
  const [segmentFilter, setSegmentFilter] = useState<string>("__all");
  const players = Object.values(state.players);

  const filteredPlayers =
    segmentFilter === "__all"
      ? players
      : players.filter((p) => p.segments?.includes(segmentFilter));

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Players</h1>
          <p className="text-xs text-slate-400">
            Portfolio of players monitored by the risk platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Filter by segment</span>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              <option value="__all">All</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical Risk">Critical Risk</option>
              <option value="VPN Users">VPN Users</option>
              <option value="Multi Device Users">Multi Device Users</option>
              <option value="Chargeback Players">Chargeback Players</option>
              <option value="High Depositors">High Depositors</option>
            </select>
          </div>
          <Badge variant="outline">
            {filteredPlayers.length} players
          </Badge>
        </div>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Player ID</TH>
              <TH>Name</TH>
              <TH>Risk Score</TH>
              <TH>Segments</TH>
              <TH>KYC Status</TH>
              <TH>CDD Tier</TH>
              <TH>Alert Count</TH>
              <TH>Last Activity</TH>
            </TR>
          </THead>
          <TBody>
            {filteredPlayers.map((p) => {
              const alertCount = state.alerts.filter(
                (a) => a.playerId === p.playerId,
              ).length;
              return (
                <TR key={p.playerId}>
                  <TD className="font-mono text-[11px] text-slate-300">
                    <Link
                      href={`/players/${p.playerId}`}
                      className="text-emerald-300 hover:underline"
                    >
                      {p.playerId}
                    </Link>
                  </TD>
                  <TD className="text-xs text-slate-100">
                    <Link
                      href={`/players/${p.playerId}`}
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {p.riskScore}
                      </span>
                      <Badge
                        variant={
                          p.riskLevel === "Critical"
                            ? "danger"
                            : p.riskLevel === "High"
                              ? "warning"
                              : "success"
                        }
                      >
                        {p.riskLevel}
                      </Badge>
                    </div>
                  </TD>
                  <TD className="text-xs text-slate-200">
                    <div className="flex flex-wrap gap-1">
                      {(p.segments ?? []).slice(0, 3).map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                      {(p.segments?.length ?? 0) > 3 && (
                        <span className="text-[10px] text-slate-500">
                          +{(p.segments?.length ?? 0) - 3} more
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        p.kycStatus === "Approved"
                          ? "success"
                          : p.kycStatus === "Failed"
                            ? "danger"
                            : "outline"
                      }
                    >
                      {p.kycStatus}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-slate-200">{p.cddTier}</TD>
                  <TD className="text-xs text-slate-200">{alertCount}</TD>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(p.lastActivity).toLocaleString()}
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

