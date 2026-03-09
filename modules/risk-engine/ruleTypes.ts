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
  | { type: "createAlert"; severity: AlertSeverity }
  | { type: "openCase" }
  | { type: "assignSegment"; value: string }
  | { type: "blockAction" }
  | { type: "requestApproval" };

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

