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
  // Time-window metrics (counts)
  deposit_count_5m: number;
  deposit_count_10m: number;
  deposit_count_1h: number;
  withdrawal_count_10m: number;
  withdrawal_count_1h: number;
  withdrawal_count_24h_window: number; // alias for withdrawal_count_24h for clarity
  bet_count_5m: number;
  bet_count_10m: number;
  session_count_30m: number;
  login_count_5m: number;
  login_count_10m: number;
  casino_session_count_1h: number;
  // Sportsbook-specific metrics for the current bet context
  stake_amount: number;
  possible_payout: number;
  total_stake_event: number;
  total_stake_market: number;
  total_payout_exposure_event: number;
  total_payout_exposure_market: number;
  net_exposure_event: number;
}

const ONE_MINUTE_MS = 60 * 1000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;
const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS;
const THIRTY_MINUTES_MS = 30 * ONE_MINUTE_MS;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
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
    // windowed metrics
    deposit_count_5m: 0,
    deposit_count_10m: 0,
    deposit_count_1h: 0,
    withdrawal_count_10m: 0,
    withdrawal_count_1h: 0,
    withdrawal_count_24h_window: 0,
    bet_count_5m: 0,
    bet_count_10m: 0,
    session_count_30m: 0,
    login_count_5m: 0,
    login_count_10m: 0,
    casino_session_count_1h: 0,
    // sportsbook context
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

  // Keep only events for this player, and only last 24h to limit memory
  const nowMs = now.getTime();
  const events = allEvents.filter(
    (e) =>
      e.playerId === playerId &&
      nowMs - new Date(e.timestamp).getTime() <= TWENTY_FOUR_HOURS_MS,
  );

  for (const e of events) {
    const tsMs = new Date(e.timestamp).getTime();
    const ageMs = nowMs - tsMs;

    if (e.eventType === "deposit") {
      metrics.total_deposit_amount += e.amount ?? 0;

      if (ageMs <= TWENTY_FOUR_HOURS_MS) {
        metrics.deposit_count_24h += 1;
        metrics.deposit_count_1h += ageMs <= ONE_HOUR_MS ? 1 : 0;
        metrics.deposit_count_10m += ageMs <= TEN_MINUTES_MS ? 1 : 0;
        metrics.deposit_count_5m += ageMs <= FIVE_MINUTES_MS ? 1 : 0;
      }
    }

    if (e.eventType === "withdraw") {
      metrics.total_withdrawal_amount += e.amount ?? 0;
      if (ageMs <= TWENTY_FOUR_HOURS_MS) {
        metrics.withdrawal_count_24h += 1;
        metrics.withdrawal_count_24h_window += 1;
        metrics.withdrawal_count_1h += ageMs <= ONE_HOUR_MS ? 1 : 0;
        metrics.withdrawal_count_10m += ageMs <= TEN_MINUTES_MS ? 1 : 0;
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
      if (ageMs <= TEN_MINUTES_MS) {
        metrics.bet_count_10m += 1;
      }
      if (ageMs <= FIVE_MINUTES_MS) {
        metrics.bet_count_5m += 1;
      }
    }

    if (e.eventType === "login") {
      if (ageMs <= TEN_MINUTES_MS) {
        metrics.login_count_10m += 1;
      }
      if (ageMs <= FIVE_MINUTES_MS) {
        metrics.login_count_5m += 1;
      }
    }

    if (e.eventType === "casino_session") {
      if (ageMs <= THIRTY_MINUTES_MS) {
        metrics.session_count_30m += 1;
      }
      if (ageMs <= ONE_HOUR_MS) {
        metrics.casino_session_count_1h += 1;
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

