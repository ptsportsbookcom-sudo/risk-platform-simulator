import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function CasinoRiskPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Casino Risk</h1>
          <p className="text-xs text-slate-400">
            Overview of casino-specific risk indicators such as RTP drift and
            high-volatility play.
          </p>
        </div>
        <Badge variant="outline">Simulated view</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="High Volatility Sessions" accent="amber">
          <p className="text-3xl font-semibold text-amber-300">8</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Players currently in high-risk casino sessions.
          </p>
        </Card>
        <Card title="Bonus Abuse Signals" accent="red">
          <p className="text-3xl font-semibold text-red-300">3</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Detected bonus abuse patterns in the last 24h.
          </p>
        </Card>
        <Card title="RTP Outliers Monitored" accent="sky">
          <p className="text-3xl font-semibold text-sky-300">5</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Games with unusual RTP requiring closer monitoring.
          </p>
        </Card>
      </div>
    </>
  );
}

