import type { EngineEventType } from "./ruleEngine";

export type RuleType = "system" | "custom";

export type RiskDomain =
  | "sportsbook_trading"
  | "sportsbook_risk"
  | "casino_risk"
  | "fraud_abuse"
  | "aml_compliance"
  | "responsible_gambling"
  | "operations";

export type RuleGroup =
  // existing groups
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
  | "manual_review"
  // taxonomy groups
  | "large_transactions"
  | "large_bet"
  | "payout_exposure"
  | "odds_manipulation"
  | "arbitrage"
  | "market_exposure"
  | "bonus_farming"
  | "chip_dumping"
  | "session_velocity"
  | "session_abuse"
  | "game_exploitation"
  | "low_wagering"
  | "device_fraud"
  | "device_risk"
  | "structuring"
  | "payment_cycling"
  | "payment_abuse"
  | "suspicious_turnover"
  | "cdd_escalation"
  | "transaction_monitoring"
  | "withdrawal_velocity"
  | "loss_chasing"
  | "deposit_escalation"
  | "long_sessions"
  | "affordability"
  | "cool_off"
  | "session_duration"
  | "deposit_frequency";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_or_equals"
  | "less_or_equals"
  | "contains"
  | "in";

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  rules: (RuleCondition | ConditionGroup)[];
}

export type RuleConditions = RuleCondition[] | ConditionGroup;

export type RuleSeverity = "critical" | "high" | "medium" | "low";

export type RuleAction =
  | { type: "createAlert" }
  | { type: "createCase" }
  | { type: "assignSegment"; value: string }
  // sportsbook / financial controls
  | { type: "blockBet" }
  | { type: "limitStake"; value?: number }
  | { type: "blockDeposit" }
  | { type: "blockWithdrawal" }
  // gameplay controls
  | { type: "blockBonus" }
  | { type: "blockGameplay" }
  // compliance controls
  | { type: "requireKyc" }
  | { type: "moveCddTier"; value?: string }
  // account / category controls
  | { type: "freezeAccount" }
  | { type: "closeAccount" }
  | { type: "changeCategory"; value?: string }
  // workflow / queue routing
  | { type: "sendToHighRiskReview" };

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: RuleType;
  domain: RiskDomain;
  group: RuleGroup;
  severity?: RuleSeverity;
  eventType?: EngineEventType | "any";
  conditions: RuleConditions;
  actions: RuleAction[];
}

