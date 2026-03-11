import type { RiskEngineState, PlayerRiskState } from "../risk-engine";
import {
  type BulkCategoryChangeRequest,
  type BulkCategoryChangeSummary,
  type BulkCategoryChangeHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkCategoryChange(
  state: RiskEngineState,
  request: BulkCategoryChangeRequest,
): { nextState: RiskEngineState; summary: BulkCategoryChangeSummary } {
  const mutableState = state as MutableRiskEngineState;

  const nextPlayers: Record<string, PlayerRiskState> = { ...state.players };

  const affectedIds: string[] = [];
  let failed = 0;

  for (const id of request.identifiers) {
    const player = state.players[id];
    if (!player) {
      failed += 1;
      continue;
    }

    // Category is stored as an optional field on the player for simulator purposes.
    const previousCategory = (player as PlayerRiskState & { category?: string })
      .category;
    const newCategory =
      request.changeToPreviousCategory && previousCategory
        ? previousCategory
        : request.newCategory;

    if (!newCategory) {
      failed += 1;
      continue;
    }

    nextPlayers[player.playerId] = {
      ...player,
      // category is not part of the strict PlayerRiskState type but is safe to attach
      ...(previousCategory !== undefined || newCategory !== undefined
        ? ({ category: newCategory } as unknown as PlayerRiskState)
        : {}),
    };

    affectedIds.push(player.playerId);
  }

  const summary: BulkCategoryChangeSummary = {
    uploaded: request.identifiers.length,
    success: affectedIds.length,
    failed,
    appliedCategory: request.newCategory,
  };

  const history: BulkCategoryChangeHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: affectedIds,
    partner: request.partner,
    newCategory: request.newCategory,
    changeToPreviousCategory: request.changeToPreviousCategory,
    reasonForClose: request.reasonForClose,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkCategoryChangeHistory = [
    ...(mutableState.bulkCategoryChangeHistory ?? []),
    history,
  ];

  const nextState: RiskEngineState = {
    ...state,
    players: nextPlayers,
  };

  return { nextState, summary };
}

