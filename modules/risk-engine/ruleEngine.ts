import type { RiskLevel } from "./riskScore";

export type EngineEventType =
  | "player_created"
  | "login"
  | "deposit"
  | "withdraw"
  | "bonus_claim"
  | "casino_session"
  | "place_bet"
  | "large_bet"
  | "vpn_login"
  | "multi_device_login"
  | "chargeback"
  | "kyc_failure"
  | "cdd_threshold_breach";

export type KycLevel = "KYC_0" | "KYC_1" | "KYC_2";

export interface PlayerRiskSnapshot {
  playerId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  kycLevel: KycLevel;
  depositTimestamps: string[];
  deviceIds: string[];
  segments: string[];
}

export interface EngineEvent {
  id: string;
  playerId: string;
  eventType: EngineEventType;
  amount?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type AlertSeverity =
  | "Low"
  | "Medium"
  | "High"
  | "Critical"
  | "Sportsbook";

export interface RuleEvaluation {
  ruleId: string;
  description: string;
  delta: number;
  createAlert: boolean;
  alertSeverity?: AlertSeverity;
  createCase?: boolean;
}

const DEPOSIT_VELOCITY_WINDOW_MINUTES = 10;

export function evaluateRules(
  event: EngineEvent,
  player: PlayerRiskSnapshot,
): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];

  // Rule 1: Deposit Before KYC
  if (event.eventType === "deposit" && player.kycLevel === "KYC_0") {
    results.push({
      ruleId: "R1_DEPOSIT_BEFORE_KYC",
      description: "Deposit before KYC completion (KYC_0).",
      delta: 50,
      createAlert: true,
      alertSeverity: "Medium",
    });
  }

  // Rule 2: High Deposit Velocity (3 deposits within a short period)
  if (event.eventType === "deposit") {
    const now = new Date(event.timestamp).getTime();
    const windowMs = DEPOSIT_VELOCITY_WINDOW_MINUTES * 60 * 1000;
    const depositsInWindow =
      player.depositTimestamps.filter(
        (ts) => now - new Date(ts).getTime() <= windowMs,
      ).length + 1; // include current deposit

    if (depositsInWindow >= 3) {
      results.push({
        ruleId: "R2_HIGH_DEPOSIT_VELOCITY",
        description: "High deposit velocity detected.",
        delta: 30,
        createAlert: true,
        alertSeverity: "High",
      });
    }
  }

  // Rule 3: VPN Login
  if (event.eventType === "vpn_login") {
    results.push({
      ruleId: "R3_VPN_LOGIN",
      description: "Login from VPN / Proxy detected.",
      delta: 40,
      createAlert: true,
      alertSeverity: "High",
    });
  }

  // Rule 4: Chargeback
  if (event.eventType === "chargeback") {
    results.push({
      ruleId: "R4_CHARGEBACK",
      description: "Chargeback reported on player account.",
      delta: 100,
      createAlert: true,
      alertSeverity: "Critical",
      createCase: true,
    });
  }

  // Rule 5: Large Bet
  if (event.eventType === "large_bet") {
    results.push({
      ruleId: "R5_LARGE_BET",
      description: "Large bet above threshold placed.",
      delta: 20,
      createAlert: true,
      alertSeverity: "Sportsbook",
    });
  }

  // Rule 7: High Risk Withdrawal (segment-based)
  if (
    event.eventType === "withdraw" &&
    player.segments.includes("High Risk")
  ) {
    results.push({
      ruleId: "R100_HIGH_RISK_WITHDRAWAL",
      description: "Withdrawal by a high-risk segmented player.",
      delta: 30,
      createAlert: true,
      alertSeverity: "High",
    });
  }

  // Rule 6: Multi Device Login
  if (
    event.metadata &&
    (event.eventType === "login" || event.eventType === "multi_device_login")
  ) {
    const deviceIdRaw = (event.metadata as { deviceId?: unknown }).deviceId;
    if (typeof deviceIdRaw === "string" && deviceIdRaw.length > 0) {
      const knownDevices = player.deviceIds;
      const isNewDevice = !knownDevices.includes(deviceIdRaw);
      if (isNewDevice && knownDevices.length >= 1) {
        results.push({
          ruleId: "R6_MULTI_DEVICE_LOGIN",
          description: "Player logged in from a new device.",
          delta: 30,
          createAlert: true,
          alertSeverity: "High",
        });
      }
    }
  }

  return results;
}

