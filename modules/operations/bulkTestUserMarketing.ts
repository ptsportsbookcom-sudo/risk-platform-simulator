import type { RiskEngineState } from "../risk-engine";
import {
  type BulkTestUserMarketingRequest,
  type BulkTestUserMarketingSummary,
  type BulkTestUserMarketingHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkTestUserMarketing(
  state: RiskEngineState,
  request: BulkTestUserMarketingRequest,
): { nextState: RiskEngineState; summary: BulkTestUserMarketingSummary } {
  const mutableState = state as MutableRiskEngineState;

  const processedIds: string[] = [];
  let failed = 0;

  for (const id of request.identifiers) {
    const player = state.players[id];
    if (!player) {
      failed += 1;
      continue;
    }

    // For now, we only log these operations; flags can be added to the player model later.
    processedIds.push(player.playerId);
  }

  const summary: BulkTestUserMarketingSummary = {
    accountsProcessed: processedIds.length,
    accountsFailed: failed,
  };

  const history: BulkTestUserMarketingHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: processedIds,
    markTestUser: request.markTestUser,
    removeMarketingSubscription: request.removeMarketingSubscription,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkTestUserMarketingHistory = [
    ...(mutableState.bulkTestUserMarketingHistory ?? []),
    history,
  ];

  return { nextState: state, summary };
}

