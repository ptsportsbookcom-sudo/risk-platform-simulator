import type { RiskEngineState } from "../risk-engine/riskEngine";

export function getPlayerLiability(
  state: RiskEngineState,
  playerId: string,
): number {
  return state.playerLiability?.[playerId] ?? 0;
}

export function getEventLiability(
  state: RiskEngineState,
  eventIdOrName: string,
): number {
  return state.eventLiability?.[eventIdOrName] ?? 0;
}

export function getMarketLiability(
  state: RiskEngineState,
  marketIdOrName: string,
): number {
  return state.marketLiability?.[marketIdOrName] ?? 0;
}

