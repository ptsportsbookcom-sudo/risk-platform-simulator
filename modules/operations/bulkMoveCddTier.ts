import type { RiskEngineState, PlayerRiskState } from "../risk-engine";
import {
  type BulkMoveCddTierRequest,
  type BulkMoveCddTierSummary,
  type BulkMoveCddTierHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkMoveCddTier(
  state: RiskEngineState,
  request: BulkMoveCddTierRequest,
): { nextState: RiskEngineState; summary: BulkMoveCddTierSummary } {
  const mutableState = state as MutableRiskEngineState;

  const nextPlayers: Record<string, PlayerRiskState> = { ...state.players };
  const movedIds: string[] = [];
  let failed = 0;

  for (const id of request.identifiers) {
    const player = state.players[id];
    if (!player) {
      failed += 1;
      continue;
    }

    nextPlayers[player.playerId] = {
      ...player,
      cddTier: request.newTier,
    };
    movedIds.push(player.playerId);
  }

  const summary: BulkMoveCddTierSummary = {
    accountsMoved: movedIds.length,
    accountsFailed: failed,
  };

  const history: BulkMoveCddTierHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: movedIds,
    newTier: request.newTier,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkMoveCddTierHistory = [
    ...(mutableState.bulkMoveCddTierHistory ?? []),
    history,
  ];

  const nextState: RiskEngineState = {
    ...state,
    players: nextPlayers,
  };

  return { nextState, summary };
}

