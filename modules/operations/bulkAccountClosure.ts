import type { RiskEngineState, PlayerRiskState } from "../risk-engine";
import {
  type BulkAccountClosureRequest,
  type BulkAccountClosureSummary,
  type BulkAccountClosureHistoryEntry,
  type MutableRiskEngineState,
} from "./operationsTypes";

function findPlayerByIdentifier(
  state: RiskEngineState,
  identifier: string,
): PlayerRiskState | undefined {
  // In this simulator, we treat the playerId as the primary identifier.
  // Additional identifiers (username, ECR ID, external ECR ID, email)
  // can be mapped to playerId by the UI layer before calling this module.
  return state.players[identifier];
}

export function bulkAccountClosure(
  state: RiskEngineState,
  request: BulkAccountClosureRequest,
): { nextState: RiskEngineState; summary: BulkAccountClosureSummary } {
  const mutableState = state as MutableRiskEngineState;

  const closedIds: string[] = [];
  let failed = 0;

  const nextPlayers: Record<string, PlayerRiskState> = { ...state.players };

  for (const id of request.identifiers) {
    const player = findPlayerByIdentifier(state, id);
    if (!player) {
      failed += 1;
      continue;
    }

    if (!request.overrideClosedAccounts && player.accountStatus === "Closed") {
      failed += 1;
      continue;
    }

    nextPlayers[player.playerId] = {
      ...player,
      accountStatus: "Closed",
      canDeposit: false,
      canWithdraw: false,
      blockedActions: {
        ...(player.blockedActions ?? {}),
        deposit: true,
        withdrawal: true,
        gameplay: true,
      },
    };
    closedIds.push(player.playerId);
  }

  const summary: BulkAccountClosureSummary = {
    totalUploaded: request.identifiers.length,
    validAccounts: closedIds.length,
    failedAccounts: failed,
    closedAccountIds: closedIds,
  };

  const historyEntry: BulkAccountClosureHistoryEntry = {
    updatedTime: new Date().toISOString(),
    accountsClosed: closedIds,
    reason: request.reasonForClosure,
    comments: request.comments,
    agent: request.agent,
  };

  mutableState.bulkAccountClosureHistory = [
    ...(mutableState.bulkAccountClosureHistory ?? []),
    historyEntry,
  ];

  const nextState: RiskEngineState = {
    ...state,
    players: nextPlayers,
    // history arrays kept via mutableState reference
  };

  return { nextState, summary };
}

