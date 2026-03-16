 "use client";

import Link from "next/link";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";

function MetricTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-50">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const { state } = useRiskEngine();

  const players = Object.values(state.players ?? {});
  const alerts = state.alerts ?? [];
  const cases = state.cases ?? [];
  const highRiskBets = state.highRiskBets ?? [];
  const bets = state.bets ?? [];

  const totalPlayers = players.length;
  const totalAlerts = alerts.length;
  const openAlerts = alerts.filter(
    (a) => a.status !== "resolved" && a.status !== "dismissed",
  ).length;
  const totalCases = cases.length;
  const openCases = cases.filter((c) => c.status === "Open").length;
  const closedCases = cases.filter((c) => c.status === "Closed").length;

  const highRiskPlayers = players.filter((p) =>
    (p.segments ?? []).includes("high_risk"),
  ).length;

  const totalHighRiskBets = highRiskBets.length;
  const pendingHighRiskBets = highRiskBets.filter(
    (b) => b.status === "pending",
  ).length;

  const alertGroups = alerts.reduce<
    Record<
      string,
      {
        severity: string;
        total: number;
        open: number;
        resolved: number;
      }
    >
  >((acc, alert) => {
    const key = `${alert.ruleTriggered}|${alert.severity}`;
    const existing = acc[key] ?? {
      severity: alert.severity,
      total: 0,
      open: 0,
      resolved: 0,
    };
    existing.total += 1;
    if (alert.status === "resolved" || alert.status === "dismissed") {
      existing.resolved += 1;
    } else {
      existing.open += 1;
    }
    acc[key] = existing;
    return acc;
  }, {});

  const resolvedAlerts = alerts.filter((a) => a.status === "resolved").length;
  const alertResolutionRate =
    totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0;

  const segmentCounts = players.reduce<Record<string, number>>((acc, p) => {
    for (const seg of p.segments ?? []) {
      acc[seg] = (acc[seg] ?? 0) + 1;
    }
    return acc;
  }, {});

  const sortedSegments = Object.entries(segmentCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const topSegments = sortedSegments.slice(0, 5);

  const totalBets = bets.length;
  const totalStake = bets.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const largestBet = bets.reduce((max, b) => {
    const s = b.amount ?? 0;
    return s > max ? s : max;
  }, 0);

  const fraudSegments = [
    { id: "multi_account", label: "Multi-Account Risk" },
    { id: "multi_account_cluster", label: "Multi-Account Cluster" },
    { id: "vpn_user", label: "VPN Usage" },
    { id: "bonus_abuse_risk", label: "Bonus Abuse Risk" },
    { id: "withdrawal_abuse", label: "Withdrawal Abuse" },
  ];

  const rgSegments = [
    { id: "loss_chasing", label: "Loss Chasing" },
    { id: "deposit_escalation", label: "Deposit Escalation" },
    { id: "affordability_risk", label: "Affordability Risk" },
    { id: "cool_off_required", label: "Cool-Off Required" },
  ];

  const countPlayersWithSegment = (segmentId: string) =>
    players.filter((p) => (p.segments ?? []).includes(segmentId)).length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Risk &amp; Compliance Reports
          </h1>
          <p className="text-xs text-slate-400">
            Operational and compliance metrics computed from the in-memory risk
            engine state.
          </p>
        </div>
        <Badge variant="outline">Reporting layer (simulated)</Badge>
      </div>

      {/* 1. Risk Overview */}
      <Card
        title="Risk Overview"
        description="High-level snapshot of risk and compliance workload."
      >
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricTile label="Total Players" value={totalPlayers} />
          <MetricTile label="Total Alerts" value={totalAlerts} />
          <MetricTile label="Open Alerts" value={openAlerts} />
          <MetricTile label="Open Cases" value={openCases} />
          <MetricTile label="High Risk Players" value={highRiskPlayers} />
          <MetricTile label="High Risk Bets" value={totalHighRiskBets} />
        </div>
        <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-3">
          <Link
            href="/reports/rule-performance"
            className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 hover:border-emerald-500/70 hover:bg-slate-900"
          >
            <div className="font-semibold text-slate-100">
              Rule Performance
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              View alert outcomes and fraud detection rates per rule.
            </div>
          </Link>
          <Link
            href="/reports/pending-kyc"
            className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 hover:border-sky-500/70 hover:bg-slate-900"
          >
            <div className="font-semibold text-slate-100">Pending KYC</div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Review players with outstanding KYC requirements.
            </div>
          </Link>
          <Link
            href="/reports/negative-balance"
            className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 hover:border-amber-500/70 hover:bg-slate-900"
          >
            <div className="font-semibold text-slate-100">
              Negative Balances
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">
              Monitor players with negative account balances.
            </div>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 2. Alert Analytics */}
        <Card
          title="Alert Analytics"
          description="Distribution of alerts by rule and severity."
        >
          {Object.keys(alertGroups).length === 0 ? (
            <p className="text-xs text-slate-400">No alerts generated yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Alert Type</TH>
                  <TH>Severity</TH>
                  <TH>Total</TH>
                  <TH>Open</TH>
                  <TH>Resolved / Dismissed</TH>
                </TR>
              </THead>
              <TBody>
                {Object.entries(alertGroups).map(([key, stats]) => {
                  const [ruleId] = key.split("|");
                  return (
                    <TR key={key}>
                      <TD className="text-[11px] text-slate-200">
                        <span className="font-mono">{ruleId}</span>
                      </TD>
                      <TD className="text-[11px]">
                        <Badge variant="outline">{stats.severity}</Badge>
                      </TD>
                      <TD className="text-[11px] text-slate-100">
                        {stats.total}
                      </TD>
                      <TD className="text-[11px] text-amber-200">
                        {stats.open}
                      </TD>
                      <TD className="text-[11px] text-emerald-200">
                        {stats.resolved}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>

        {/* 3. Investigation Performance */}
        <Card
          title="Investigation Performance"
          description="Alert and case handling metrics."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile label="Total Alerts" value={totalAlerts} />
            <MetricTile label="Open Alerts" value={openAlerts} />
            <MetricTile
              label="Investigating Alerts"
              value={alerts.filter((a) => a.status === "investigating").length}
            />
            <MetricTile label="Resolved Alerts" value={resolvedAlerts} />
            <MetricTile label="Total Cases" value={totalCases} />
            <MetricTile label="Open Cases" value={openCases} />
            <MetricTile label="Closed Cases" value={closedCases} />
            <MetricTile
              label="Alert Resolution Rate"
              value={`${alertResolutionRate.toFixed(0)}%`}
            />
          </div>
        </Card>
      </div>

      {/* 4. Segment Distribution */}
      <Card
        title="Segment Distribution"
        description="Player distribution across risk and RG segments."
      >
        {sortedSegments.length === 0 ? (
          <p className="text-xs text-slate-400">No segments assigned yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <Table>
              <THead>
                <TR>
                  <TH>Segment</TH>
                  <TH>Players</TH>
                </TR>
              </THead>
              <TBody>
                {sortedSegments.map(([seg, count]) => (
                  <TR key={seg}>
                    <TD className="text-[11px] text-slate-200">{seg}</TD>
                    <TD className="text-[11px] text-slate-100">{count}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Top 5 Segments
              </div>
              {topSegments.map(([seg, count]) => (
                <div
                  key={seg}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-100"
                >
                  <span>{seg}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 5. Sportsbook Exposure */}
        <Card
          title="Sportsbook Exposure"
          description="High-level sportsbook activity summary."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Total Bets" value={totalBets} />
            <MetricTile
              label="Total Stake"
              value={totalStake.toFixed(2)}
            />
            <MetricTile
              label="Largest Bet"
              value={largestBet.toFixed(2)}
            />
            <MetricTile
              label="High Risk Bets"
              value={totalHighRiskBets}
            />
            <MetricTile
              label="Pending Reviews"
              value={pendingHighRiskBets}
            />
          </div>
          {totalBets > 0 && (
            <div className="mt-3 text-[11px] text-slate-400">
              Exposure estimate is approximated as the sum of bet stakes across
              all recorded bets.
            </div>
          )}
          <div className="mt-3 text-[11px]">
            <Link
              href="/high-risk-bets"
              className="text-emerald-300 hover:text-emerald-200"
            >
              View High Risk Bets queue
            </Link>
          </div>
        </Card>

        {/* 6. Fraud Detection Metrics */}
        <Card
          title="Fraud Detection Metrics"
          description="Players currently flagged for key fraud and abuse patterns."
        >
          <Table>
            <THead>
              <TR>
                <TH>Pattern</TH>
                <TH>Players</TH>
              </TR>
            </THead>
            <TBody>
              {fraudSegments.map((s) => (
                <TR key={s.id}>
                  <TD className="text-[11px] text-slate-200">{s.label}</TD>
                  <TD className="text-[11px] text-slate-100">
                    {countPlayersWithSegment(s.id)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      {/* 7. Responsible Gambling Monitoring */}
      <Card
        title="Responsible Gambling Indicators"
        description="Players currently under RG monitoring segments."
      >
        <Table>
          <THead>
            <TR>
              <TH>Indicator</TH>
              <TH>Players</TH>
            </TR>
          </THead>
          <TBody>
            {rgSegments.map((s) => (
              <TR key={s.id}>
                <TD className="text-[11px] text-slate-200">{s.label}</TD>
                <TD className="text-[11px] text-slate-100">
                  {countPlayersWithSegment(s.id)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

