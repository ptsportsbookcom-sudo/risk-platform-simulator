import type { RiskEngineState } from "../risk-engine";
import {
  type BulkAffiliateNameRequest,
  type BulkAffiliateNameSummary,
  type BulkAffiliateNameHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkAffiliateNameUpdate(
  state: RiskEngineState,
  request: BulkAffiliateNameRequest,
): { nextState: RiskEngineState; summary: BulkAffiliateNameSummary } {
  const mutableState = state as MutableRiskEngineState;

  const updatedIds: string[] = [];
  let failed = 0;

  for (const id of request.identifiers) {
    const player = state.players[id];
    if (!player) {
      failed += 1;
      continue;
    }
    // Affiliate name is not yet modelled on PlayerRiskState;
    // we only record that an update would have been applied.
    updatedIds.push(player.playerId);
  }

  const summary: BulkAffiliateNameSummary = {
    uploaded: request.identifiers.length,
    success: updatedIds.length,
    failed,
  };

  const history: BulkAffiliateNameHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: updatedIds,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkAffiliateNameHistory = [
    ...(mutableState.bulkAffiliateNameHistory ?? []),
    history,
  ];

  return { nextState: state, summary };
}

