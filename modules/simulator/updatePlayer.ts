import type { PlayerRiskState } from "../risk-engine";

export function updatePlayer(
  player: PlayerRiskState,
  patch: Partial<PlayerRiskState> | Record<string, unknown>,
): PlayerRiskState {
  return {
    ...player,
    ...(patch as PlayerRiskState),
  };
}

