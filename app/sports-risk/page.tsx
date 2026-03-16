"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function SportsRiskPage() {
  const { state } = useRiskEngine();

  // Aggregate liability across all players using existing metrics
  const players = Object.values(state.players ?? {});
  let totalEventLiability = 0;
  let totalMarketLiability = 0;

  for (const p of players) {
    const m = p.metrics as any;
    if (m) {
      totalEventLiability += m.event_liability ?? 0;
      totalMarketLiability += m.market_liability ?? 0;
    }
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Sports Risk</h1>
          <p className="text-xs text-slate-400">
            Simplified view of sportsbook exposure and suspicious betting
            patterns.
          </p>
        </div>
        <Badge variant="outline">Simulated markets</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Flagged Markets" accent="amber">
          <p className="text-3xl font-semibold text-amber-300">4</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Markets with clustering or suspicious price-taking.
          </p>
        </Card>
        <Card title="Large Bets (Last 24h)" accent="sky">
          <p className="text-3xl font-semibold text-sky-300">19</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Over the configured high-stake threshold.
          </p>
        </Card>
        <Card title="Correlated Selections" accent="red">
          <p className="text-3xl font-semibold text-red-300">2</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Potential match-fixing or insider information signals.
          </p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Sportsbook Liability">
          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Event Liability</span>
              <span className="font-semibold">
                €{totalEventLiability.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Market Liability</span>
              <span className="font-semibold">
                €{totalMarketLiability.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

