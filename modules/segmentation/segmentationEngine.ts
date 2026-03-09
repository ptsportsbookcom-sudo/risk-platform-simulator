import type {
  PlayerRiskState,
  EngineEventLogEntry,
} from "../risk-engine/riskEngine";

export function updatePlayerSegments(
  player: PlayerRiskState,
  allEvents: EngineEventLogEntry[],
): string[] {
  // Segmentation is now rule-driven only. Rules with the `assignSegment`
  // action are responsible for adding segment labels to `player.segments`.
  // This helper simply normalizes and de-duplicates what is already stored
  // on the player object.
  const base = player.segments ?? [];
  const unique = Array.from(new Set(base));
  return unique;
}

