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

  const pendingKyc = players.filter((p) => p.kycStatus === "Pending").length;
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

  const openAlerts = state.alerts.filter((a) => a.status === "open").length;
  const investigatingAlerts = state.alerts.filter(
    (a) => a.status === "investigating",
  ).length;
  const pendingHighRiskBets = state.highRiskBets.filter(
    (b) => b.status === "pending",
  ).length;

  const alerts = state.alerts ?? [];
  const cases = state.cases ?? [];

  // Top triggered rules from alerts
  const topRules = (() => {
    const counts = new Map<
      string,
      { ruleId: string; ruleName: string; count: number }
    >();
    for (const alert of alerts) {
      const ruleId = alert.ruleTriggered;
      const existing = counts.get(ruleId);
      const rule =
        state.rules.find((r) => r.id === ruleId) ??
        state.rules.find((r) => r.name === ruleId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(ruleId, {
          ruleId,
          ruleName: rule?.name ?? ruleId,
          count: 1,
        });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();

  // Alert summary by severity and status
  const alertSeverityCounts: Record<
    "Critical" | "High" | "Medium" | "Low",
    number
  > = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  const alertStatusCounts: Record<
    "open" | "investigating" | "resolved" | "dismissed",
    number
  > = {
    open: 0,
    investigating: 0,
    resolved: 0,
    dismissed: 0,
  };

  for (const a of alerts) {
    if (a.severity in alertSeverityCounts) {
      alertSeverityCounts[a.severity as keyof typeof alertSeverityCounts] += 1;
    }
    if (a.status in alertStatusCounts) {
      alertStatusCounts[a.status as keyof typeof alertStatusCounts] += 1;
    }
  }

  // Fraud pattern summary (by segment id)
  const fraudSegments = [
    { id: "bonus_abuser", label: "Bonus Abuse" },
    { id: "vpn_user", label: "VPN User" },
    { id: "multi_account", label: "Multi Account Risk" },
    { id: "withdrawal_abuse", label: "Withdrawal Abuse" },
  ] as const;

  const countPlayersInSegment = (segmentId: string) =>
    players.filter((p) => (p.segments ?? []).includes(segmentId)).length;

  // Investigation KPIs
  const totalAlerts = alerts.length;
  const totalCases = cases.length;
  const openCases = cases.filter((c) => c.status === "Open").length;
  const closedCases = cases.filter((c) => c.status === "Closed").length;
  const resolutionRate =
    totalCases > 0 ? (closedCases / totalCases) * 100 : 0;

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
        <Card title="Alerts" accent="red">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-red-300">
              {formatNumber(openAlerts)}
            </div>
            <Badge variant="danger">
              Open / Investigating: {openAlerts} / {investigatingAlerts}
            </Badge>
          </div>
          {alerts.length === 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              No alerts detected in the current simulation.
            </p>
          )}
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
          {cases.length === 0 && (
            <p className="mt-2 text-[11px] text-slate-500">
              No cases available in the current simulation.
            </p>
          )}
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

      <div className="mt-6 space-y-4">
        <Card
          title="Fraud Patterns"
          description="Counts of players in key fraud and abuse segments."
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-xs text-slate-200">
            {fraudSegments.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"
              >
                <div className="text-[11px] font-semibold text-slate-100">
                  {pattern.label}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-400">Players</span>
                  <span className="text-sm font-semibold text-slate-50">
                    {formatNumber(countPlayersInSegment(pattern.id))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Investigation Performance"
          description="Snapshot of alert and case handling workload."
        >
          <div className="grid gap-3 md:grid-cols-3 text-xs text-slate-300">
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">Total Alerts</div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(totalAlerts)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">Open Alerts</div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(openAlerts)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">
                Investigating Alerts
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(investigatingAlerts)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">Total Cases</div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(totalCases)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">Open Cases</div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(openCases)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[11px] text-slate-400">Closed Cases</div>
              <div className="mt-1 text-sm font-semibold text-slate-50">
                {formatNumber(closedCases)}
              </div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 md:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">
                    Case Resolution Rate
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-50">
                    {resolutionRate.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Top Triggered Rules"
          description="Rules generating the most alerts in the current run."
        >
          {topRules.length === 0 ? (
            <p className="text-xs text-slate-400">
              No alerts generated yet. Use the simulator to exercise rules.
            </p>
          ) : (
            <div className="space-y-1 text-xs text-slate-200">
              {topRules.map((r) => (
                <div
                  key={r.ruleId}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5"
                >
                  <div>
                    <div>{r.ruleName}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {r.ruleId}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-slate-100">
                    {formatNumber(r.count)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Alert Summary"
          description="Counts of alerts by severity and investigation status."
        >
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400">
              No alerts detected in the current simulation.
            </p>
          ) : (
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-200">
                  By Severity
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Critical</span>
                    <span className="font-mono">
                      {formatNumber(alertSeverityCounts.Critical)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>High</span>
                    <span className="font-mono">
                      {formatNumber(alertSeverityCounts.High)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium</span>
                    <span className="font-mono">
                      {formatNumber(alertSeverityCounts.Medium)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Low</span>
                    <span className="font-mono">
                      {formatNumber(alertSeverityCounts.Low)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-200">
                  By Status
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Open</span>
                    <span className="font-mono">
                      {formatNumber(alertStatusCounts.open)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Investigating</span>
                    <span className="font-mono">
                      {formatNumber(alertStatusCounts.investigating)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Resolved</span>
                    <span className="font-mono">
                      {formatNumber(alertStatusCounts.resolved)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dismissed</span>
                    <span className="font-mono">
                      {formatNumber(alertStatusCounts.dismissed)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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

