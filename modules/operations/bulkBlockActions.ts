import type { RiskEngineState, PlayerRiskState } from "../risk-engine";
import {
  type BulkBlockActionsRequest,
  type BulkBlockActionsSummary,
  type BulkBlockActionsHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

export function bulkBlockActions(
  state: RiskEngineState,
  request: BulkBlockActionsRequest,
): { nextState: RiskEngineState; summary: BulkBlockActionsSummary } {
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

    const blockedActions = {
      ...(player.blockedActions ?? {}),
    };

    if (request.actions.includes("deposit")) {
      blockedActions.deposit = true;
    }
    if (request.actions.includes("withdrawal")) {
      blockedActions.withdrawal = true;
    }
    if (request.actions.includes("gameplay")) {
      blockedActions.gameplay = true;
    }
    if (request.actions.includes("bonus")) {
      // Bonus blocking is recorded here; enforcement will be implemented by bonus modules.
      (blockedActions as Record<string, boolean>).bonus = true;
    }

    nextPlayers[player.playerId] = {
      ...player,
      canDeposit: request.actions.includes("deposit") ? false : player.canDeposit,
      canWithdraw: request.actions.includes("withdrawal")
        ? false
        : player.canWithdraw,
      blockedActions,
    };

    affectedIds.push(player.playerId);
  }

  const summary: BulkBlockActionsSummary = {
    accountsProcessed: affectedIds.length,
    accountsFailed: failed,
    actionsApplied: request.actions,
  };

  const history: BulkBlockActionsHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accounts: affectedIds,
    actionsApplied: request.actions,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkBlockActionsHistory = [
    ...(mutableState.bulkBlockActionsHistory ?? []),
    history,
  ];

  const nextState: RiskEngineState = {
    ...state,
    players: nextPlayers,
  };

  return { nextState, summary };
}

