"use client";

import { useMemo, useState } from "react";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import {
  getClosedAccountFundSummary,
  closedAccountFundSummaryToCsv,
  type ClosedAccountFundFilters,
} from "@/modules/compliance/closedAccountFundSummary";

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

export default function ClosedAccountFundsPage() {
  const { state } = useRiskEngine();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [partner, setPartner] = useState("");
  const [excludeTest, setExcludeTest] = useState(false);

  const filters: ClosedAccountFundFilters | undefined = useMemo(() => {
    const dateRange =
      from && to
        ? {
            from,
            to,
          }
        : undefined;
    return {
      dateRange,
      partners: partner ? [partner] : undefined,
      excludeTestAccounts: excludeTest,
    };
  }, [from, to, partner, excludeTest]);

  const rows = useMemo(
    () => getClosedAccountFundSummary(state, filters),
    [state, filters],
  );

  const handleExport = () => {
    const csv = closedAccountFundSummaryToCsv(rows);
    downloadCsv("closed_account_funds.csv", csv);
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Closed Account Fund Summary
          </h1>
          <p className="text-xs text-slate-400">
            Closed accounts with remaining positive balances.
          </p>
        </div>
        <Badge variant="outline">{rows.length} accounts</Badge>
      </div>

      <Card
        title="Filters"
        description="Filter by closure time, partner, and test-account flag."
      >
        <div className="flex flex-wrap items-end gap-3 text-xs">
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

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Partner</span>
            <input
              type="text"
              placeholder="Any"
              className="w-40 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              className="h-3 w-3 rounded border border-slate-600 bg-slate-900"
              checked={excludeTest}
              onChange={(e) => setExcludeTest(e.target.checked)}
            />
            Exclude test accounts
          </label>

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
        description="Closed accounts with outstanding balances."
      >
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">No records for the selected filters.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>ECR ID</TH>
                <TH>Category</TH>
                <TH>Category Change Time</TH>
                <TH>Balance</TH>
                <TH>Currency</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.ECR_ID}>
                  <TD className="font-mono text-[11px]">{row.ECR_ID}</TD>
                  <TD className="text-[11px]">{row.category}</TD>
                  <TD className="font-mono text-[11px]">
                    {new Date(row.categoryChangeTime).toLocaleString()}
                  </TD>
                  <TD className="text-[11px]">{row.balance}</TD>
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

