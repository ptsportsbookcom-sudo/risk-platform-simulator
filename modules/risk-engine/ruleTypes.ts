import type { EngineEventType, AlertSeverity } from "./ruleEngine";

export type RuleType = "system" | "custom";

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
  | { type: "riskScoreIncrease"; value: number }
  | { type: "createAlert"; severity: AlertSeverity }
  | { type: "createCase" }
  | { type: "assignSegment"; value: string };

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: RuleType;
  eventType?: EngineEventType | "any";
  conditions: RuleCondition[];
  actions: RuleAction[];
}

