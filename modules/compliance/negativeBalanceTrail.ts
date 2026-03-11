import type { RiskEngineState } from "../risk-engine";

export type RelativeDateRange = "1D" | "1W" | "2W" | "1M";

export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface NegativeBalanceTrailFilters {
  range?: RelativeDateRange;
  customRange?: DateRangeFilter;
}

export interface NegativeBalanceTrailRow {
  ECR_ID: string;
  externalEcrId?: string;
  winReverseAmount: number;
  chargebackAmount: number;
  fraudAmount: number;
  realCashAmount: number;
  currency: string;
}

function applyRangeFilter(
  dateIso: string,
  filters?: NegativeBalanceTrailFilters,
): boolean {
  if (!filters) return true;

  const ts = new Date(dateIso).getTime();
  if (Number.isNaN(ts)) return true;

  if (filters.customRange) {
    const from = new Date(filters.customRange.from).getTime();
    const to = new Date(filters.customRange.to).getTime();
    if (!Number.isNaN(from) && ts < from) return false;
    if (!Number.isNaN(to) && ts > to) return false;
    return true;
  }

  if (filters.range) {
    const now = Date.now();
    let deltaMs = 0;
    switch (filters.range) {
      case "1D":
        deltaMs = 24 * 60 * 60 * 1000;
        break;
      case "1W":
        deltaMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "2W":
        deltaMs = 14 * 24 * 60 * 60 * 1000;
        break;
      case "1M":
        deltaMs = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        deltaMs = 0;
    }
    if (deltaMs === 0) return true;
    return ts >= now - deltaMs;
  }

  return true;
}

/**
 * Returns players with negative balances.
 * In this simulator, component amounts (winReverse/chargeback/fraud) are not tracked,
 * so they are reported as 0 and the full negative balance is treated as realCashAmount.
 */
export function getNegativeBalanceTrail(
  state: RiskEngineState,
  filters?: NegativeBalanceTrailFilters,
): NegativeBalanceTrailRow[] {
  const rows: NegativeBalanceTrailRow[] = [];

  for (const player of Object.values(state.players)) {
    if (!player.negativeBalance && player.balance >= 0) {
      continue;
    }

    if (!applyRangeFilter(player.lastActivity, filters)) {
      continue;
    }

    rows.push({
      ECR_ID: player.playerId,
      externalEcrId: undefined,
      winReverseAmount: 0,
      chargebackAmount: 0,
      fraudAmount: 0,
      realCashAmount: player.balance,
      currency: "EUR",
    });
  }

  return rows;
}

export function negativeBalanceTrailToCsv(
  rows: NegativeBalanceTrailRow[],
): string {
  const header = [
    "ECR_ID",
    "externalEcrId",
    "winReverseAmount",
    "chargebackAmount",
    "fraudAmount",
    "realCashAmount",
    "currency",
  ];

  const lines = rows.map((r) =>
    [
      r.ECR_ID,
      r.externalEcrId ?? "",
      r.winReverseAmount.toString(),
      r.chargebackAmount.toString(),
      r.fraudAmount.toString(),
      r.realCashAmount.toString(),
      r.currency,
    ].join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

