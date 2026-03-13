"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

function formatCurrency(amount: number) {
  return `€${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function FinancialRiskReportPage() {
  const { state } = useRiskEngine();
  const events = state.events ?? [];
  const alerts = state.alerts ?? [];
  const rules = state.rules ?? [];

  const {
    blockedBetsAmount,
    blockedWithdrawalsAmount,
    confirmedFraudAmount,
    productRisk,
    alertStatusCounts,
  } = useMemo(() => {
    let blockedBetsAmount = 0;
    let blockedWithdrawalsAmount = 0;
    let confirmedFraudAmount = 0;

    const productRisk: Record<"casino" | "sportsbook" | "bonus", number> = {
      casino: 0,
      sportsbook: 0,
      bonus: 0,
    };

    const alertStatusCounts: Record<
      "open" | "investigating" | "confirmed_fraud" | "false_positive",
      number
    > = {
      open: 0,
      investigating: 0,
      confirmed_fraud: 0,
      false_positive: 0,
    };

    // Pre-index rules by id for quick lookup
    const ruleById = new Map<string, (typeof rules)[number]>();
    for (const r of rules) {
      ruleById.set(r.id, r);
    }

    // 1. Blocked bets & withdrawals + product risk from events
    for (const ev of events) {
      const amount = ev.amount ?? 0;

      // Determine if any triggered rule blocked bet / withdrawal
      const triggered = ev.triggeredRules ?? [];
      let isBetBlocked = false;
      let isWithdrawalBlocked = false;

      for (const ruleId of triggered) {
        const rule = ruleById.get(ruleId);
        if (!rule || !rule.actions) continue;
        for (const action of rule.actions) {
          if (action.type === "blockBet") {
            isBetBlocked = true;
          }
          if (action.type === "blockWithdrawal") {
            isWithdrawalBlocked = true;
          }
        }
      }

      if (isBetBlocked && amount > 0) {
        blockedBetsAmount += amount;
      }
      if (isWithdrawalBlocked && amount > 0) {
        blockedWithdrawalsAmount += amount;
      }

      // Product risk exposure (by product)
      const meta = (ev.metadata ?? {}) as Record<string, unknown>;
      const productRaw = (meta.product as string | undefined) ?? "";
      let product: "casino" | "sportsbook" | "bonus" | null = null;

      if (productRaw === "casino") {
        product = "casino";
      } else if (productRaw === "sportsbook") {
        product = "sportsbook";
      } else if (productRaw === "bonus") {
        product = "bonus";
      } else if (ev.eventType === "casino_session") {
        product = "casino";
      } else if (
        ev.eventType === "place_bet" ||
        ev.eventType === "large_bet" ||
        ev.eventType === "suspicious_bet"
      ) {
        product = "sportsbook";
      } else if (ev.eventType === "bonus_claim") {
        product = "bonus";
      }

      if (product && amount > 0) {
        productRisk[product] += amount;
      }
    }

    // 2. Confirmed fraud amount from alerts and related events
    for (const alert of alerts) {
      if (alert.status === "confirmed_fraud") {
        const relatedEvent = events.find(
          (e) =>
            e.playerId === alert.playerId &&
            (e.triggeredRules ?? []).includes(alert.ruleTriggered),
        );
        if (relatedEvent?.amount != null) {
          confirmedFraudAmount += relatedEvent.amount;
        }
      }

      if (alert.status in alertStatusCounts) {
        alertStatusCounts[alert.status as keyof typeof alertStatusCounts] += 1;
      }
    }

    return {
      blockedBetsAmount,
      blockedWithdrawalsAmount,
      confirmedFraudAmount,
      productRisk,
      alertStatusCounts,
    };
  }, [events, alerts, rules]);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Financial Risk Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Overview of blocked financial exposure and confirmed fraud based on
            current simulator data.
          </p>
        </div>
        <Badge variant="outline">Financial risk (simulated)</Badge>
      </div>

      {/* 1. Financial Overview */}
      <Card
        title="Financial Overview"
        description="Aggregate financial impact of automated risk controls."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="text-[11px] text-slate-400">
              Blocked Bets Amount
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-300">
              {formatCurrency(blockedBetsAmount)}
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="text-[11px] text-slate-400">
              Blocked Withdrawals Amount
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-300">
              {formatCurrency(blockedWithdrawalsAmount)}
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="text-[11px] text-slate-400">
              Confirmed Fraud Amount
            </div>
            <div className="mt-1 text-sm font-semibold text-red-300">
              {formatCurrency(confirmedFraudAmount)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 2. Risk Exposure by Product */}
        <Card
          title="Risk Exposure by Product"
          description="Sum of transactional amounts by product type."
        >
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Risk Amount</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD className="text-xs text-slate-100">Casino</TD>
                <TD className="text-xs text-slate-200">
                  {formatCurrency(productRisk.casino)}
                </TD>
              </TR>
              <TR>
                <TD className="text-xs text-slate-100">Sportsbook</TD>
                <TD className="text-xs text-slate-200">
                  {formatCurrency(productRisk.sportsbook)}
                </TD>
              </TR>
              <TR>
                <TD className="text-xs text-slate-100">Bonus</TD>
                <TD className="text-xs text-slate-200">
                  {formatCurrency(productRisk.bonus)}
                </TD>
              </TR>
            </TBody>
          </Table>
          <p className="mt-3 text-[11px] text-slate-500">
            Risk amounts are approximated using the event amount field for
            deposit, withdrawal, bet, and bonus-related events.
          </p>
        </Card>

        {/* 3. Alert Volume Trend (snapshot counts) */}
        <Card
          title="Alert Volume by Status"
          description="Current distribution of alerts by investigation status."
        >
          <Table>
            <THead>
              <TR>
                <TH>Status</TH>
                <TH>Count</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD className="text-xs text-slate-100">Open</TD>
                <TD className="text-xs text-slate-200">
                  {alertStatusCounts.open}
                </TD>
              </TR>
              <TR>
                <TD className="text-xs text-slate-100">Investigating</TD>
                <TD className="text-xs text-slate-200">
                  {alertStatusCounts.investigating}
                </TD>
              </TR>
              <TR>
                <TD className="text-xs text-slate-100">Confirmed Fraud</TD>
                <TD className="text-xs text-slate-200">
                  {alertStatusCounts.confirmed_fraud}
                </TD>
              </TR>
              <TR>
                <TD className="text-xs text-slate-100">False Positives</TD>
                <TD className="text-xs text-slate-200">
                  {alertStatusCounts.false_positive}
                </TD>
              </TR>
            </TBody>
          </Table>
          <p className="mt-3 text-[11px] text-slate-500">
            Use this distribution to monitor whether automated controls are
            calibrated correctly for your current rule set.
          </p>
        </Card>
      </div>
    </>
  );
}

