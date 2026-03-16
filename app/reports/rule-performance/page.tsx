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
   const cases = state.cases ?? [];

  const rows = useMemo(() => {
    const byRule = new Map<
      string,
      {
        ruleId: string;
        ruleName: string;
        alerts: number;
        resolvedAlerts: number;
        cases: number;
      }
    >();

    const alertsById = new Map<string, (typeof alerts)[number]>();
    for (const alert of alerts) {
      alertsById.set(alert.id, alert);
    }

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
          alerts: 0,
          resolvedAlerts: 0,
          cases: 0,
        } as const);

      const current = { ...existing };
      current.alerts += 1;

      if (alert.status === "resolved") {
        current.resolvedAlerts += 1;
      }

      byRule.set(key, current);
    }

    // Attribute cases to rules via their linked alerts
    for (const c of cases) {
      const uniqueRuleIds = new Set<string>();
      for (const alertId of c.alerts ?? []) {
        const alert = alertsById.get(alertId);
        if (!alert) continue;
        uniqueRuleIds.add(alert.ruleTriggered);
      }
      for (const ruleId of uniqueRuleIds) {
        const existing = byRule.get(ruleId);
          if (!existing) continue;
        byRule.set(ruleId, {
          ...existing,
          cases: existing.cases + 1,
        });
      }
    }

    return Array.from(byRule.values()).sort(
      (a, b) => b.alerts - a.alerts,
    );
  }, [alerts, rules, cases]);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Rule Performance Report
          </h1>
          <p className="text-xs text-slate-400">
            Aggregated alerts and cases per rule based on current simulator
            state.
          </p>
        </div>
        <Badge variant="outline">
          {alerts.length} alerts across {rows.length} rules
        </Badge>
      </div>

      <Card
        title="Rule Performance"
        description="Alerts, cases, and resolved alerts per rule."
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
                <TH>Cases</TH>
                <TH>Resolved Alerts</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => {
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
                      {row.alerts}
                    </TD>
                    <TD className="text-[11px] text-slate-100">
                      {row.cases}
                    </TD>
                    <TD className="text-[11px] text-emerald-300">
                      {row.resolvedAlerts}
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

