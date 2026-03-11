"use client";

import { useMemo, useState } from "react";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import {
  getNegativeBalanceTrail,
  negativeBalanceTrailToCsv,
  type NegativeBalanceTrailFilters,
  type RelativeDateRange,
} from "@/modules/compliance/negativeBalanceTrail";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function NegativeBalanceTrailPage() {
  const { state } = useRiskEngine();

  const [range, setRange] = useState<RelativeDateRange | "custom" | "all">(
    "1W",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters: NegativeBalanceTrailFilters | undefined = useMemo(() => {
    if (range === "all") return undefined;
    if (range === "custom") {
      if (!from || !to) return undefined;
      return { customRange: { from, to } };
    }
    return { range };
  }, [range, from, to]);

  const rows = useMemo(
    () => getNegativeBalanceTrail(state, filters),
    [state, filters],
  );

  const handleExport = () => {
    const csv = negativeBalanceTrailToCsv(rows);
    downloadCsv("negative_balance_trail.csv", csv);
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Negative Balance Trail
          </h1>
          <p className="text-xs text-slate-400">
            Players with negative balances for operational and compliance review.
          </p>
        </div>
        <Badge variant="outline">{rows.length} players</Badge>
      </div>

      <Card
        title="Filters"
        description="Filter by time window to focus on recent negative balance activity."
      >
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Range</span>
            <select
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
              value={range}
              onChange={(e) =>
                setRange(e.target.value as RelativeDateRange | "custom" | "all")
              }
            >
              <option value="all">All</option>
              <option value="1D">Last 1 day</option>
              <option value="1W">Last 1 week</option>
              <option value="2W">Last 2 weeks</option>
              <option value="1M">Last 1 month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {range === "custom" && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">From</span>
                <input
                  type="date"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">To</span>
                <input
                  type="date"
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Export CSV
          </button>
        </div>
      </Card>

      <Card
        title="Results"
        description="Negative balance positions by player."
      >
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">No records for the selected filters.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>ECR ID</TH>
                <TH>External ECR ID</TH>
                <TH>Win Reverse Amount</TH>
                <TH>Chargeback Amount</TH>
                <TH>Fraud Amount</TH>
                <TH>Real Cash Amount</TH>
                <TH>Currency</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.ECR_ID}>
                  <TD className="font-mono text-[11px]">{row.ECR_ID}</TD>
                  <TD className="font-mono text-[11px]">
                    {row.externalEcrId ?? "-"}
                  </TD>
                  <TD className="text-[11px]">{row.winReverseAmount}</TD>
                  <TD className="text-[11px]">{row.chargebackAmount}</TD>
                  <TD className="text-[11px]">{row.fraudAmount}</TD>
                  <TD className="text-[11px]">{row.realCashAmount}</TD>
                  <TD className="text-[11px]">{row.currency}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

