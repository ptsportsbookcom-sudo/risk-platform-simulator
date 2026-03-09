import type { RiskLevel } from "./riskScore";
import type { Rule, RuleCondition } from "./ruleTypes";

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
  createAlert: boolean;
  alertSeverity?: AlertSeverity;
  openCase?: boolean;
  blockAction?: boolean;
  requestApproval?: boolean;
  assignSegments?: string[];
}

const DEPOSIT_VELOCITY_WINDOW_MINUTES = 10;

function conditionMatches(
  condition: RuleCondition,
  event: EngineEvent,
  player: PlayerRiskSnapshot,
): boolean {
  const { field, operator, value } = condition;

  let left: unknown;

  if (field === "amount") {
    left = event.amount ?? 0;
  } else if (field === "segments") {
    left = player.segments ?? [];
  } else if (field === "eventType") {
    left = event.eventType;
  } else {
    // Fallback: try metadata
    left = (event.metadata ?? ({} as Record<string, unknown>))[
      field as keyof typeof event.metadata
    ];
  }

  if (operator === "equals") {
    return left === value;
  }

  if (operator === "greater_than") {
    const lv = Number(left ?? 0);
    const rv = Number(value);
    return lv > rv;
  }

  if (operator === "less_than") {
    const lv = Number(left ?? 0);
    const rv = Number(value);
    return lv < rv;
  }

  if (operator === "contains") {
    if (Array.isArray(left)) {
      return left.includes(value as never);
    }
    if (typeof left === "string" && typeof value === "string") {
      return left.includes(value);
    }
  }

  return false;
}

export function evaluateRules(
  event: EngineEvent,
  player: PlayerRiskSnapshot,
  customRules: Rule[],
): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];

  // Rule 1: Deposit Before KYC
  if (event.eventType === "deposit" && player.kycLevel === "KYC_0") {
    results.push({
      ruleId: "R1_DEPOSIT_BEFORE_KYC",
      description: "Deposit before KYC completion (KYC_0).",
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
      createAlert: true,
      alertSeverity: "High",
    });
  }

  // Rule 4: Chargeback
  if (event.eventType === "chargeback") {
    results.push({
      ruleId: "R4_CHARGEBACK",
      description: "Chargeback reported on player account.",
      createAlert: true,
      alertSeverity: "Critical",
      openCase: true,
    });
  }

  // Rule 5: Large Bet
  if (event.eventType === "large_bet") {
    results.push({
      ruleId: "R5_LARGE_BET",
      description: "Large bet above threshold placed.",
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
          createAlert: true,
          alertSeverity: "High",
        });
      }
    }
  }

  // Custom rules (system + analyst-created) evaluated generically
  const activeCustom = (customRules ?? []).filter(
    (r) =>
      r.enabled &&
      (r.eventType === "any" || r.eventType === event.eventType || r.eventType == null),
  );

  for (const rule of activeCustom) {
    const matches =
      (rule.conditions ?? []).length === 0 ||
      rule.conditions.every((c) => conditionMatches(c, event, player));

    if (!matches) continue;

    let createAlert = false;
    let alertSeverity: AlertSeverity | undefined;
    let openCase = false;
    let blockAction = false;
    let requestApproval = false;
    const assignSegments: string[] = [];

    for (const action of rule.actions ?? []) {
      if (action.type === "createAlert") {
        createAlert = true;
        alertSeverity = action.severity;
      } else if (action.type === "openCase") {
        openCase = true;
      } else if (action.type === "blockAction") {
        blockAction = true;
      } else if (action.type === "requestApproval") {
        requestApproval = true;
      } else if (action.type === "assignSegment") {
        assignSegments.push(action.value);
      }
    }

    if (createAlert || openCase || blockAction || requestApproval || assignSegments.length > 0) {
      results.push({
        ruleId: rule.id,
        description: rule.description ?? rule.name,
        createAlert,
        alertSeverity,
        openCase,
        blockAction,
        requestApproval,
        assignSegments: assignSegments.length ? assignSegments : undefined,
      });
    }
  }

  return results;
}

