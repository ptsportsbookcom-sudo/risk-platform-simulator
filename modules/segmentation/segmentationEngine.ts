import type {
  PlayerRiskState,
  EngineEventLogEntry,
  RiskEngineState,
} from "../risk-engine/riskEngine";

/**
 * SegmentationEngine
 *
 * Lightweight segmentation layer that operates on an in-memory map of players.
 * It is responsible for assigning and removing segment identifiers on players.
 */
export class SegmentationEngine {
  constructor(private players: Map<string, PlayerRiskState>) {}

  assignSegment(playerId: string, segment: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    const current = new Set(player.segments ?? []);
    current.add(segment);
    player.segments = Array.from(current);
  }

  removeSegment(playerId: string, segment: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    const current = new Set(player.segments ?? []);
    current.delete(segment);
    player.segments = Array.from(current);
  }

  getPlayerSegments(playerId: string): string[] {
    const player = this.players.get(playerId);
    return player?.segments ?? [];
  }
}

export function createSegmentationEngineFromState(
  state: RiskEngineState,
): SegmentationEngine {
  const playersMap = new Map<string, PlayerRiskState>();
  for (const [id, player] of Object.entries(state.players ?? {})) {
    playersMap.set(id, player);
  }
  return new SegmentationEngine(playersMap);
}

/**
 * Helper used by the RiskEngine to normalize and de-duplicate segments after
 * rule-based assignment. This keeps existing behaviour while routing adds
 * and removals through the SegmentationEngine.
 */
export function updatePlayerSegments(
  player: PlayerRiskState,
  allEvents: EngineEventLogEntry[],
): string[] {
  // Currently segmentation is rule-driven and operator-driven. The events are
  // provided for future behavioural segmentation but are not used yet.
  const base = player.segments ?? [];
  const unique = Array.from(new Set(base));
  return unique;
}

