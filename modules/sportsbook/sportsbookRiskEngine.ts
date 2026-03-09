import type { EngineEventLogEntry } from "../risk-engine/riskEngine";

export interface SportsbookExposure {
  totalStakeEvent: number;
  totalStakeMarket: number;
  totalPayoutExposureEvent: number;
  totalPayoutExposureMarket: number;
  netExposureEvent: number;
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

  let totalStakeEvent = 0;
  let totalStakeMarket = 0;
  let totalPayoutExposureEvent = 0;
  let totalPayoutExposureMarket = 0;

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
      totalStakeEvent += stake;
      totalPayoutExposureEvent += payout;
    }
    if (isSameMarket) {
      totalStakeMarket += stake;
      totalPayoutExposureMarket += payout;
    }
  }

  return {
    totalStakeEvent,
    totalStakeMarket,
    totalPayoutExposureEvent,
    totalPayoutExposureMarket,
    netExposureEvent: totalPayoutExposureEvent - totalStakeEvent,
  };
}

