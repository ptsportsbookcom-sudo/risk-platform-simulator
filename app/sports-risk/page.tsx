import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SportsRiskPage() {
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
    </>
  );
}

