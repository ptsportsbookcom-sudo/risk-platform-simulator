"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import Link from "next/link";

export default function PlayersPage() {
  const { state } = useRiskEngine();
  const players = Object.values(state.players);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Players</h1>
          <p className="text-xs text-slate-400">
            Portfolio of players monitored by the risk platform.
          </p>
        </div>
        <Badge variant="outline">
          {players.length} players in current simulation
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Player ID</TH>
              <TH>Name</TH>
              <TH>Risk Score</TH>
              <TH>KYC Status</TH>
              <TH>CDD Tier</TH>
              <TH>Alert Count</TH>
              <TH>Last Activity</TH>
            </TR>
          </THead>
          <TBody>
            {players.map((p) => {
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

