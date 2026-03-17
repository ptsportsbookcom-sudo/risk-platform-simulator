"use client";

import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type FraudPattern = {
  id: string;
  label: string;
};

const FRAUD_PATTERNS: FraudPattern[] = [
  { id: "bonus_abuser", label: "Bonus Abuse" },
  { id: "vpn_user", label: "VPN Users" },
  { id: "multi_account", label: "Multi-Account Risk" },
  { id: "withdrawal_abuse", label: "Withdrawal Abuse" },
];

export default function FraudPatternDashboardPage() {
  const { state } = useRiskEngine();

  const players = Object.values(state.players ?? {});
  const alerts = state.alerts ?? [];

  const countPlayers = (segmentId: string): number =>
    players.filter((p) => (p.segments ?? []).includes(segmentId)).length;

  const countAlerts = (segmentId: string): number => {
    const playerIds = new Set(
      players
        .filter((p) => (p.segments ?? []).includes(segmentId))
        .map((p) => p.playerId),
    );
    return alerts.filter((a) => playerIds.has(a.playerId)).length;
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Fraud Pattern Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            High-level overview of key simulated fraud and abuse patterns using
            segments and alerts.
          </p>
        </div>
        <Badge variant="outline">
          {players.length} players / {alerts.length} alerts
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FRAUD_PATTERNS.map((pattern) => {
          const playerCount = countPlayers(pattern.id);
          const alertCount = countAlerts(pattern.id);
          return (
            <Card key={pattern.id} title={pattern.label}>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pattern ID</span>
                  <span className="font-mono text-[11px] text-slate-100">
                    {pattern.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Players</span>
                  <span className="text-sm font-semibold text-slate-50">
                    {playerCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alerts</span>
                  <span className="text-sm font-semibold text-slate-50">
                    {alertCount}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

