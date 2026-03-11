import type { RiskEngineState, PlayerRiskState } from "../risk-engine";

export function applyDeposit(
  state: RiskEngineState,
  playerId: string,
  amount: number,
): RiskEngineState {
  const player = state.players[playerId];
  if (!player) return state;

  const updated: PlayerRiskState = {
    ...player,
    balance: player.balance + amount,
    // @ts-expect-error - totalDeposits is a simulator-only extension
    totalDeposits: (player.totalDeposits ?? 0) + amount,
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: updated,
    },
  };
}