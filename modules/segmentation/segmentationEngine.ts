import type {
  PlayerRiskState,
  EngineEventLogEntry,
} from "../risk-engine/riskEngine";

export function updatePlayerSegments(
  player: PlayerRiskState,
  allEvents: EngineEventLogEntry[],
): string[] {
  const segments: string[] = [];

  const events = allEvents.filter((e) => e.playerId === player.playerId);

  // High Risk / Critical Risk
  if (player.riskScore >= 150) {
    segments.push("High Risk");
  }
  if (player.riskScore >= 300) {
    segments.push("Critical Risk");
  }

  // VPN Users
  if (
    events.some(
      (e) =>
        (e.metadata as { vpnDetected?: boolean } | undefined)?.vpnDetected ===
        true,
    )
  ) {
    segments.push("VPN Users");
  }

  // Multi Device Users
  if ((player.deviceIds ?? []).length > 1) {
    segments.push("Multi Device Users");
  }

  // Chargeback Players
  if (events.some((e) => e.eventType === "chargeback")) {
    segments.push("Chargeback Players");
  }

  // High Depositors
  const totalDeposits = events
    .filter((e) => e.eventType === "deposit")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  if (totalDeposits > 2000) {
    segments.push("High Depositors");
  }

  return segments;
}

