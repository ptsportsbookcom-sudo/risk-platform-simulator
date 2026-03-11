import type { RiskEngineState } from "../risk-engine";

export interface DateRange {
  from: string;
  to: string;
}

export interface ClosedAccountFundFilters {
  dateRange?: DateRange;
  partners?: string[];
  excludeTestAccounts?: boolean;
}

export interface ClosedAccountFundRow {
  ECR_ID: string;
  category: string;
  categoryChangeTime: string;
  balance: number;
  currency: string;
}

function inDateRange(dateIso: string, range?: DateRange): boolean {
  if (!range) return true;
  const ts = new Date(dateIso).getTime();
  if (Number.isNaN(ts)) return true;
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  if (!Number.isNaN(from) && ts < from) return false;
  if (!Number.isNaN(to) && ts > to) return false;
  return true;
}

/**
 * Returns closed accounts with positive balances.
 * accountCategory is approximated from accountStatus === \"Closed\".
 */
export function getClosedAccountFundSummary(
  state: RiskEngineState,
  filters?: ClosedAccountFundFilters,
): ClosedAccountFundRow[] {
  const rows: ClosedAccountFundRow[] = [];

  for (const player of Object.values(state.players)) {
    if (player.accountStatus !== "Closed") continue;
    if (player.balance <= 0) continue;

    if (!inDateRange(player.lastActivity, filters?.dateRange)) {
      continue;
    }

    // partners / test-account filters are not modelled in the simulator; they are ignored here.

    rows.push({
      ECR_ID: player.playerId,
      category: "closed",
      categoryChangeTime: player.lastActivity,
      balance: player.balance,
      currency: "EUR",
    });
  }

  return rows;
}

export function closedAccountFundSummaryToCsv(
  rows: ClosedAccountFundRow[],
): string {
  const header = ["ECR_ID", "category", "categoryChangeTime", "balance", "currency"];

  const lines = rows.map((r) =>
    [
      r.ECR_ID,
      r.category,
      r.categoryChangeTime,
      r.balance.toString(),
      r.currency,
    ].join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

