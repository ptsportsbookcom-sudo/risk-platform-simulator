"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function RulePerformanceReportPage() {
  const { state } = useRiskEngine();
  const alerts = state.alerts ?? [];
  const rules = state.rules ?? [];

  const rows = useMemo(() => {
    const byRule = new Map<
      string,
      {
        ruleId: string;
        ruleName: string;
        totalAlerts: number;
        confirmedFraud: number;
        falsePositives: number;
        investigating: number;
        openAlerts: number;
      }
    >();

    for (const alert of alerts) {
      const ruleId = alert.ruleTriggered;
      const rule =
        rules.find((r) => r.id === ruleId) ??
        rules.find((r) => r.name === ruleId) ??
        null;
      const key = ruleId;
      const existing =
        byRule.get(key) ?? ({
          ruleId,
          ruleName: rule?.name ?? ruleId,
          totalAlerts: 0,
          confirmedFraud: 0,
          falsePositives: 0,
          investigating: 0,
          openAlerts: 0,
        } as const);

      const current = { ...existing };
      current.totalAlerts += 1;

      if (alert.status === "confirmed_fraud") {
        current.confirmedFraud += 1;
      } else if (alert.status === "false_positive") {
        current.falsePositives += 1;
      } else if (alert.status === "investigating") {
        current.investigating += 1;
      } else if (alert.status === "open") {
        current.openAlerts += 1;
      }

      byRule.set(key, current);
    }

    return Array.from(byRule.values()).sort(
      (a, b) => b.totalAlerts - a.totalAlerts,
    );
  }, [alerts, rules]);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Rule Performance
          </h1>
          <p className="text-xs text-slate-400">
            Alert outcome analytics per rule based on current simulator state.
          </p>
        </div>
        <Badge variant="outline">
          {alerts.length} alerts across {rows.length} rules
        </Badge>
      </div>

      <Card
        title="Rule Alert Performance"
        description="Counts of alerts and investigation outcomes per rule."
      >
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">
            No alerts generated yet. Trigger events in the simulator to populate
            this report.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Rule</TH>
                <TH>Alerts</TH>
                <TH>Fraud</TH>
                <TH>False Pos</TH>
                <TH>Open / Investigating</TH>
                <TH>Detection Rate</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => {
                const openInvestigating =
                  row.openAlerts + row.investigating;
                const detectionRate =
                  row.totalAlerts > 0
                    ? (row.confirmedFraud / row.totalAlerts) * 100
                    : 0;

                return (
                  <TR key={row.ruleId}>
                    <TD className="text-xs text-slate-100">
                      <div className="flex flex-col">
                        <span>{row.ruleName}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {row.ruleId}
                        </span>
                      </div>
                    </TD>
                    <TD className="text-[11px] text-slate-100">
                      {row.totalAlerts}
                    </TD>
                    <TD className="text-[11px] text-emerald-300">
                      {row.confirmedFraud}
                    </TD>
                    <TD className="text-[11px] text-slate-300">
                      {row.falsePositives}
                    </TD>
                    <TD className="text-[11px] text-amber-200">
                      {openInvestigating}
                    </TD>
                    <TD className="text-[11px] text-slate-100">
                      {row.totalAlerts === 0
                        ? "—"
                        : `${detectionRate.toFixed(1)}%`}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

