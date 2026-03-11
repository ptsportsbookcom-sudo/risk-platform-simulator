import type { RiskEngineState } from "../risk-engine";
import {
  type BulkAffiliateIdentifierRequest,
  type BulkAffiliateIdentifierSummary,
  type BulkAffiliateIdentifierHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkAffiliateIdentifierUpdate(
  state: RiskEngineState,
  request: BulkAffiliateIdentifierRequest,
): { nextState: RiskEngineState; summary: BulkAffiliateIdentifierSummary } {
  const mutableState = state as MutableRiskEngineState;

  const validIds: string[] = [];
  const invalidIds: string[] = [];

  for (const id of request.identifiers) {
    const player = state.players[id];
    if (!player) {
      invalidIds.push(id);
      continue;
    }
    // Affiliate identifiers are not yet modelled on PlayerRiskState;
    // we only record that an update would have been applied.
    validIds.push(player.playerId);
  }

  const summary: BulkAffiliateIdentifierSummary = {
    totalUploaded: request.identifiers.length,
    validAccounts: validIds.length,
    invalidAccounts: invalidIds.length,
  };

  const history: BulkAffiliateIdentifierHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: validIds,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkAffiliateIdentifierHistory = [
    ...(mutableState.bulkAffiliateIdentifierHistory ?? []),
    history,
  ];

  return { nextState: state, summary };
}

