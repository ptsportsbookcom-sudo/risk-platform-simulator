"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { mockPlayers } from "@/data/mockPlayers";
import { mockAlerts } from "@/data/mockAlerts";
import { mockCases } from "@/data/mockCases";
import { mockHighRiskBets } from "@/data/mockBets";

function formatNumber(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function DashboardClient() {
  const { dashboard } = useRiskEngine();

  const baseActiveAlerts = mockAlerts.filter((a) => a.status !== "Closed").length;
  const baseHighRiskPlayers = mockPlayers.filter(
    (p) => p.riskBand === "High" || p.riskBand === "Severe",
  ).length;
  const basePendingCases = mockCases.filter(
    (c) =>
      c.status === "New" ||
      c.status === "Assigned" ||
      c.status === "Investigating",
  ).length;

  const activeAlerts = baseActiveAlerts + dashboard.activeAlerts;
  const highRiskPlayers = baseHighRiskPlayers + dashboard.highRiskPlayers;
  const pendingCases = basePendingCases + dashboard.pendingCases;

  const highRiskBets = mockHighRiskBets.length;
  const pendingKyc = mockPlayers.filter((p) => p.kycStatus === "Pending").length;
  const negativeBalances = mockPlayers.filter((p) => p.negativeBalance).length;

  const totalExposureSports = 18500;
  const totalExposureCasino = 42000;

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
              {formatNumber(activeAlerts)}
            </div>
            <Badge variant="danger">Fraud &amp; AML</Badge>
          </div>
        </Card>

        <Card title="High Risk Players" accent="amber">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-amber-300">
              {formatNumber(highRiskPlayers)}
            </div>
            <Badge variant="warning">Monitoring</Badge>
          </div>
        </Card>

        <Card title="Pending Cases" accent="emerald">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-emerald-300">
              {formatNumber(pendingCases)}
            </div>
            <Badge variant="success">Work queue</Badge>
          </div>
        </Card>

        <Card title="High Risk Bets" accent="sky">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-sky-300">
              {formatNumber(highRiskBets)}
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
              <span>
                {mockPlayers.filter((p) => p.cddTier === "Enhanced").length}{" "}
                players
              </span>
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
            <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
              <span>Avg. negative balance</span>
              <span className="font-semibold text-rose-200">
                €
                {formatNumber(
                  Math.round(
                    mockPlayers
                      .filter((p) => p.negativeBalance)
                      .reduce((sum, p) => sum + Math.abs(p.balance), 0) ||
                      0 / Math.max(1, negativeBalances),
                  ),
                )}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

