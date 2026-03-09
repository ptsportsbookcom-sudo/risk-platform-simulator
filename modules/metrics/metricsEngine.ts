import type { EngineEventLogEntry } from "../risk-engine/riskEngine";
import {
  calculateExposureForBet,
  type SportsbookExposure,
} from "../sportsbook/sportsbookRiskEngine";

export interface PlayerMetrics {
  deposit_count_24h: number;
  withdrawal_count_24h: number;
  total_deposit_amount: number;
  total_withdrawal_amount: number;
  bonus_claim_count: number;
  bet_count: number;
  bet_count_1h: number;
  total_stake_amount: number;
  // Sportsbook-specific metrics for the current bet context
  stake_amount: number;
  possible_payout: number;
  total_stake_event: number;
  total_stake_market: number;
  total_payout_exposure_event: number;
  total_payout_exposure_market: number;
  net_exposure_event: number;
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
    stake_amount: 0,
    possible_payout: 0,
    total_stake_event: 0,
    total_stake_market: 0,
    total_payout_exposure_event: 0,
    total_payout_exposure_market: 0,
    net_exposure_event: 0,
  };
}

export function computePlayerMetrics(
  playerId: string,
  allEvents: EngineEventLogEntry[],
  currentBet?: EngineEventLogEntry,
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

    if (
      e.eventType === "place_bet" ||
      e.eventType === "large_bet" ||
      e.eventType === "suspicious_bet"
    ) {
      metrics.bet_count += 1;
      metrics.total_stake_amount += e.amount ?? 0;
      if (ageMs <= ONE_HOUR_MS) {
        metrics.bet_count_1h += 1;
      }
    }
  }

  // Sportsbook metrics for the current bet context (event + market exposure)
  if (
    currentBet &&
    (currentBet.eventType === "place_bet" ||
      currentBet.eventType === "large_bet" ||
      currentBet.eventType === "suspicious_bet")
  ) {
    const stake = currentBet.amount ?? 0;
    const meta = (currentBet.metadata ?? {}) as { odds?: number };
    const odds = meta.odds ?? 1;
    const possiblePayout = stake * odds;

    const exposure: SportsbookExposure = calculateExposureForBet(
      currentBet,
      allEvents,
    );

    metrics.stake_amount = stake;
    metrics.possible_payout = possiblePayout;
    metrics.total_stake_event = exposure.totalStakeEvent;
    metrics.total_stake_market = exposure.totalStakeMarket;
    metrics.total_payout_exposure_event = exposure.totalPayoutExposureEvent;
    metrics.total_payout_exposure_market = exposure.totalPayoutExposureMarket;
    metrics.net_exposure_event = exposure.netExposureEvent;
  }

  return metrics;
}

