import type {
  Rule,
  RuleCondition,
  ConditionGroup,
  RuleConditions,
  RuleSeverity,
} from "./ruleTypes";

export type EngineEventType =
  | "player_created"
  | "login"
  | "deposit"
  | "withdraw"
  | "bonus_claim"
  | "casino_session"
  | "place_bet"
  | "large_bet"
  | "suspicious_bet"
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
  metrics?: { [metricName: string]: number };
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
  createCase?: boolean;
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
  } else if (player.metrics && field in player.metrics) {
    left = player.metrics[field as keyof typeof player.metrics];
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

function evaluateConditionNode(
  node: RuleCondition | ConditionGroup,
  event: EngineEvent,
  player: PlayerRiskSnapshot,
): boolean {
  const maybeGroup = node as ConditionGroup;
  if (maybeGroup && Array.isArray(maybeGroup.rules) && maybeGroup.operator) {
    const group = maybeGroup;
    if (group.operator === "AND") {
      return group.rules.every((child) =>
        evaluateConditionNode(child as RuleCondition | ConditionGroup, event, player),
      );
    }
    // OR
    return group.rules.some((child) =>
      evaluateConditionNode(child as RuleCondition | ConditionGroup, event, player),
    );
  }

  return conditionMatches(node as RuleCondition, event, player);
}

function evaluateConditions(
  conditions: RuleConditions | undefined,
  event: EngineEvent,
  player: PlayerRiskSnapshot,
): boolean {
  if (!conditions) return true;

  if (Array.isArray(conditions)) {
    if (conditions.length === 0) return true;
    return conditions.every((c) =>
      evaluateConditionNode(c as RuleCondition | ConditionGroup, event, player),
    );
  }

  return evaluateConditionNode(
    conditions as ConditionGroup,
    event,
    player,
  );
}

function mapRuleSeverityToAlert(
  severity: RuleSeverity | undefined,
): AlertSeverity {
  switch (severity) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "low":
      return "Low";
    case "medium":
    default:
      return "Medium";
  }
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
      createCase: true,
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
    const matches = evaluateConditions(rule.conditions as RuleConditions, event, player);

    if (!matches) continue;

    let createAlert = false;
    let createCase = false;
    const assignSegments: string[] = [];

    for (const action of rule.actions ?? []) {
      if (action.type === "createAlert") {
        createAlert = true;
      } else if (action.type === "createCase") {
        createCase = true;
      } else if (action.type === "assignSegment") {
        assignSegments.push(action.value);
      }
    }

    if (createAlert || createCase || assignSegments.length > 0) {
      results.push({
        ruleId: rule.id,
        description: rule.description ?? rule.name,
        createAlert,
        alertSeverity: createAlert
          ? mapRuleSeverityToAlert(rule.severity ?? "medium")
          : undefined,
        createCase,
        assignSegments: assignSegments.length ? assignSegments : undefined,
      });
    }
  }

  return results;
}

