import type { PlayerRiskState } from "../risk-engine/riskEngine";
import type {
  Segment,
  SegmentCondition,
} from "./segmentTypes";

type SupportedField =
  | "country"
  | "registration_date"
  | "tier_level"
  | "affiliate"
  | "agent"
  | "deposit_count"
  | "withdrawal_count"
  | "deposit_amount"
  | "withdrawal_amount"
  | "wallet_currency"
  | "deposit_method"
  | "withdrawal_method"
  | "language"
  | "asn"
  | "bonus_claim_count"
  | "bet_count";

function getFieldValue(
  player: PlayerRiskState,
  field: SupportedField,
): string | number | undefined {
  const metrics = player.metrics;

  switch (field) {
    case "country":
      return player.country;
    case "registration_date":
      return player.registrationDate;
    case "tier_level":
      return player.cddTier;
    case "deposit_count":
      return metrics?.deposit_count_24h ?? 0;
    case "withdrawal_count":
      return metrics?.withdrawal_count_24h ?? 0;
    case "deposit_amount":
      return metrics?.total_deposit_amount ?? 0;
    case "withdrawal_amount":
      return metrics?.total_withdrawal_amount ?? 0;
    case "bonus_claim_count":
      return metrics?.bonus_claim_count ?? 0;
    case "bet_count":
      return metrics?.bet_count ?? 0;
    // The following attributes are not yet populated on PlayerRiskState.
    // They are included for forward compatibility and will currently
    // evaluate as undefined (conditions on them will not match).
    case "affiliate":
    case "agent":
    case "wallet_currency":
    case "deposit_method":
    case "withdrawal_method":
    case "language":
    case "asn":
      return undefined;
    default:
      return undefined;
  }
}

function evaluateCondition(
  player: PlayerRiskState,
  condition: SegmentCondition,
): boolean {
  const field = condition.field as SupportedField;
  const left = getFieldValue(player, field);

  if (left === undefined || left === null) {
    return false;
  }

  const op = condition.operator;
  const right = condition.value;

  if (op === "in" || op === "not_in") {
    const values = Array.isArray(right)
      ? right.map((v) => String(v))
      : String(right)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
    const match = values.includes(String(left));
    return op === "in" ? match : !match;
  }

  const leftNum = typeof left === "number" ? left : Number(left);
  const rightNum =
    typeof right === "number" ? right : Number(Array.isArray(right) ? right[0] : right);

  switch (op) {
    case ">":
      return leftNum > rightNum;
    case "<":
      return leftNum < rightNum;
    case "=":
      if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
        return leftNum === rightNum;
      }
      return String(left) === String(
        Array.isArray(right) ? right[0] : right,
      );
    default:
      return false;
  }
}

export function evaluateSegment(
  player: PlayerRiskState,
  segment: Segment,
): boolean {
  if (segment.type !== "dynamic") {
    return false;
  }

  const conditions = segment.conditions ?? [];
  if (conditions.length === 0) {
    return false;
  }

  const matchMode = segment.matchMode ?? "all";

  if (matchMode === "all") {
    return conditions.every((c) => evaluateCondition(player, c));
  }

  return conditions.some((c) => evaluateCondition(player, c));
}

