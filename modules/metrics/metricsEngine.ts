import type { EngineEventLogEntry } from "../risk-engine/riskEngine";

export interface PlayerMetrics {
  deposit_count_24h: number;
  withdrawal_count_24h: number;
  total_deposit_amount: number;
  total_withdrawal_amount: number;
  bonus_claim_count: number;
  bet_count: number;
  bet_count_1h: number;
  total_stake_amount: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

export function emptyPlayerMetrics(): PlayerMetrics {
  return {
    deposit_count_24h: 0,
    withdrawal_count_24h: 0,
    total_deposit_amount: 0,
    total_withdrawal_amount: 0,
    bonus_claim_count: 0,
    bet_count: 0,
    bet_count_1h: 0,
    total_stake_amount: 0,
  };
}

export function computePlayerMetrics(
  playerId: string,
  allEvents: EngineEventLogEntry[],
  now: Date = new Date(),
): PlayerMetrics {
  const metrics = emptyPlayerMetrics();

  const events = allEvents.filter((e) => e.playerId === playerId);
  const nowMs = now.getTime();

  for (const e of events) {
    const tsMs = new Date(e.timestamp).getTime();
    const ageMs = nowMs - tsMs;

    if (e.eventType === "deposit") {
      metrics.total_deposit_amount += e.amount ?? 0;
      if (ageMs <= TWENTY_FOUR_HOURS_MS) {
        metrics.deposit_count_24h += 1;
      }
    }

    if (e.eventType === "withdraw") {
      metrics.total_withdrawal_amount += e.amount ?? 0;
      if (ageMs <= TWENTY_FOUR_HOURS_MS) {
        metrics.withdrawal_count_24h += 1;
      }
    }

    if (e.eventType === "bonus_claim") {
      metrics.bonus_claim_count += 1;
    }

    if (e.eventType === "place_bet" || e.eventType === "large_bet") {
      metrics.bet_count += 1;
      metrics.total_stake_amount += e.amount ?? 0;
      if (ageMs <= ONE_HOUR_MS) {
        metrics.bet_count_1h += 1;
      }
    }
  }

  return metrics;
}

