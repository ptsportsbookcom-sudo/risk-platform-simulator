import type { EngineEventType, AlertSeverity } from "./ruleEngine";

export type RuleType = "system" | "custom";

export type RiskDomain =
  | "sportsbook_trading"
  | "fraud_abuse"
  | "aml_compliance"
  | "operations";

export type RuleGroup =
  | "sportsbook_exposure"
  | "stake_monitoring"
  | "deposit_velocity"
  | "bonus_abuse"
  | "withdrawal_anomaly"
  | "multi_account"
  | "vpn_detection"
  | "geo_mismatch"
  | "deposit_structuring"
  | "transaction_volume"
  | "cdd_threshold"
  | "affordability_threshold"
  | "player_control"
  | "manual_review";

export type ConditionOperator =
  | "equals"
  | "greater_than"
  | "less_than"
  | "contains";

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export type RuleAction =
  | { type: "createAlert"; severity: AlertSeverity }
  | { type: "createCase" }
  | { type: "assignSegment"; value: string };

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: RuleType;
  domain: RiskDomain;
  group: RuleGroup;
  eventType?: EngineEventType | "any";
  conditions: RuleCondition[];
  actions: RuleAction[];
}

