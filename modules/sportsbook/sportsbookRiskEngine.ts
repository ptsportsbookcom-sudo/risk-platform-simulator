import type { EngineEventLogEntry } from "../risk-engine/riskEngine";

export interface SportsbookExposure {
  event_stake_total: number;
  market_stake_total: number;
  event_payout_total: number;
  market_payout_total: number;
  net_exposure_event: number;
}

export function calculateExposureForBet(
  betEvent: EngineEventLogEntry,
  allEvents: EngineEventLogEntry[],
): SportsbookExposure {
  const betMeta = (betEvent.metadata ?? {}) as {
    eventName?: string;
    market?: string;
    odds?: number;
  };
  const currentEventName = betMeta.eventName ?? "UNKNOWN_EVENT";
  const currentMarket = betMeta.market ?? "UNKNOWN_MARKET";

  let eventStakeTotal = 0;
  let marketStakeTotal = 0;
  let eventPayoutTotal = 0;
  let marketPayoutTotal = 0;

  for (const e of allEvents) {
    if (e.eventType !== "place_bet" && e.eventType !== "large_bet" && e.eventType !== "suspicious_bet") {
      continue;
    }
    const meta = (e.metadata ?? {}) as {
      eventName?: string;
      market?: string;
      odds?: number;
    };
    const stake = e.amount ?? 0;
    const odds = meta.odds ?? 1;
    const payout = stake * odds;

    const isSameEvent = (meta.eventName ?? "UNKNOWN_EVENT") === currentEventName;
    const isSameMarket = (meta.market ?? "UNKNOWN_MARKET") === currentMarket;

    if (isSameEvent) {
      eventStakeTotal += stake;
      eventPayoutTotal += payout;
    }
    if (isSameMarket) {
      marketStakeTotal += stake;
      marketPayoutTotal += payout;
    }
  }

  return {
    event_stake_total: eventStakeTotal,
    market_stake_total: marketStakeTotal,
    event_payout_total: eventPayoutTotal,
    market_payout_total: marketPayoutTotal,
    net_exposure_event: eventPayoutTotal - eventStakeTotal,
  };
}

