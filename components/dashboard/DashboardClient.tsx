"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { SEGMENT_ID_TO_NAME } from "@/modules/segmentation/segmentRegistry";

function formatNumber(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function DashboardClient() {
  const { state, dashboard } = useRiskEngine();

  const players = Object.values(state.players);

  const pendingKyc = players.filter((p) => p.kycLevel !== "KYC_2").length;
  const enhancedCdd = players.filter((p) => p.cddTier === "Enhanced").length;
  const negativeBalances = players.filter((p) => p.negativeBalance).length;

  const segments = state.segments ?? [];

  const segmentCounts: Record<string, number> = {};
  for (const seg of segments) {
    segmentCounts[seg.id] = players.filter((p) =>
      p.segments?.includes(seg.id),
    ).length;
  }

  const totalExposureSports = 18500;
  const totalExposureCasino = 42000;
  const pendingHighRiskBets = state.highRiskBets.filter(
    (b) => b.status === "pending",
  ).length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Risk Overview Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Live view of risk posture across players, alerts, and exposure.
          </p>
        </div>
        <Badge variant="outline">Updates with simulator events</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Card title="Active Alerts" accent="red">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-red-300">
              {formatNumber(dashboard.activeAlerts)}
            </div>
            <Badge variant="danger">Fraud &amp; AML</Badge>
          </div>
        </Card>

        <Card title="High Risk Players" accent="amber">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-amber-300">
              {formatNumber(dashboard.highRiskPlayers)}
            </div>
            <Badge variant="warning">Monitoring</Badge>
          </div>
        </Card>

        <Card title="Pending Cases" accent="emerald">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-emerald-300">
              {formatNumber(dashboard.pendingCases)}
            </div>
            <Badge variant="success">Work queue</Badge>
          </div>
        </Card>

        <Card title="Pending High Risk Bets" accent="sky">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-sky-300">
              {formatNumber(pendingHighRiskBets)}
            </div>
            <Badge variant="outline">Sports &amp; Casino</Badge>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="KYC &amp; CDD Pipeline"
          description="Workload distribution across verification stages."
        >
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Pending KYC</span>
              <span className="font-semibold">
                {formatNumber(pendingKyc)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-900">
              <div
                className="h-2 rounded-full bg-amber-400"
                style={{ width: `${Math.min(80, pendingKyc * 20)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>Enhanced CDD</span>
              <span>{enhancedCdd} players</span>
            </div>
          </div>
        </Card>

        <Card
          title="Market Exposure"
          description="Simplified snapshot of current high-risk exposure."
        >
          <div className="space-y-4 text-xs">
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-300">
                <span>Sportsbook</span>
                <span className="font-semibold text-sky-300">
                  €{formatNumber(totalExposureSports)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900">
                <div
                  className="h-2 rounded-full bg-sky-400"
                  style={{ width: "35%" }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-slate-300">
                <span>Casino</span>
                <span className="font-semibold text-emerald-300">
                  €{formatNumber(totalExposureCasino)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900">
                <div
                  className="h-2 rounded-full bg-emerald-400"
                  style={{ width: "65%" }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Negative Balances"
          description="Players with outstanding negative wallet balances."
        >
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div>
              <div className="text-3xl font-semibold text-rose-300">
                {formatNumber(negativeBalances)}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Escalate for collections / affordability review.
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Segment Distribution"
          description="Counts of key risk and security segments."
        >
          <div className="space-y-2 text-xs text-slate-300">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className="flex items-center justify-between"
              >
                <span>{seg.name}</span>
                <span className="font-semibold">
                  {formatNumber(segmentCounts[seg.id] ?? 0)}
                </span>
              </div>
            ))}
            {segments.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No segments configured yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

