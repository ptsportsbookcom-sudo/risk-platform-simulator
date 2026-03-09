import type { EngineEventType } from "../risk-engine/ruleEngine";
import type {
  Rule,
  RuleConditions,
  RuleGroup,
  RuleSeverity,
} from "../risk-engine/ruleTypes";

// Casino events this module is concerned with
export const CASINO_EVENT_TYPES: EngineEventType[] = [
  "casino_session",
  "bonus_claim",
  "deposit",
  "withdraw",
];

// Fraud-abuse rule groups that relate to casino / bonus abuse
export const CASINO_FRAUD_GROUPS: RuleGroup[] = [
  "bonus_abuse",
  "deposit_velocity",
  // other fraud-abuse groupings can be mapped to existing groups
  "low_wagering",
  "session_velocity",
  "payment_cycling",
  "multi_account_bonus",
] as RuleGroup[];

function conditionAnd(rules: RuleConditions): RuleConditions {
  // Helper to express AND groups while staying compatible with flat arrays
  return rules;
}

function makeRule(options: {
  id: string;
  name: string;
  description?: string;
  group: RuleGroup;
  severity: RuleSeverity;
  eventType?: EngineEventType | "any";
  conditions: RuleConditions;
  actions: Rule["actions"];
}): Rule {
  return {
    id: options.id,
    name: options.name,
    description: options.description,
    enabled: true,
    type: "system",
    domain: "fraud_abuse",
    group: options.group,
    severity: options.severity,
    eventType: options.eventType ?? "any",
    conditions: options.conditions,
    actions: options.actions,
  };
}

/**
 * Preconfigured casino fraud / bonus abuse rules.
 *
 * These rely on metrics already computed by the MetricsEngine (where available)
 * and are evaluated by the existing RuleEngine when added to the rules list.
 */
export function createDefaultCasinoRules(): Rule[] {
  const rules: Rule[] = [];

  // bonus_farming: Multiple Bonus Claims (24h)
  rules.push(
    makeRule({
      id: "casino_bonus_farming_multiple_bonus_claims",
      name: "Multiple Bonus Claims (24h)",
      description: "More than 2 bonus claims in the last 24 hours.",
      group: "bonus_abuse",
      severity: "high",
      eventType: "bonus_claim",
      conditions: [
        {
          field: "bonus_claim_count_24h",
          operator: "greater_than",
          value: 2,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "createCase" },
        { type: "assignSegment", value: "bonus_abuse_risk" },
      ],
    }),
  );

  // deposit_withdrawal_abuse: Deposit → Withdrawal Without Gameplay
  rules.push(
    makeRule({
      id: "casino_deposit_withdrawal_abuse_no_gameplay",
      name: "Deposit → Withdrawal Without Gameplay",
      description:
        "Player deposits then requests withdrawal without placing any bets.",
      group: "deposit_velocity",
      severity: "critical",
      eventType: "withdraw",
      conditions: conditionAnd([
        {
          field: "deposit_count_24h",
          operator: "greater_than",
          value: 0,
        },
        {
          field: "eventType",
          operator: "equals",
          value: "withdraw",
        },
        {
          field: "bet_count",
          operator: "equals",
          value: 0,
        },
      ]),
      actions: [
        { type: "createAlert" },
        { type: "createCase" },
        { type: "assignSegment", value: "withdrawal_abuse" },
      ],
    }),
  );

  // low_wagering: Minimal Wagering After Bonus
  rules.push(
    makeRule({
      id: "casino_low_wagering_after_bonus",
      name: "Minimal Wagering After Bonus",
      description:
        "Bonus fully wagered with very few bets - potential low wagering behaviour.",
      group: "player_control",
      severity: "medium",
      eventType: "bonus_claim",
      conditions: conditionAnd([
        { field: "bonus_wager_progress", operator: "equals", value: 100 },
        { field: "bet_count", operator: "less_than", value: 5 },
      ]),
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "low_wagering_behavior" },
      ],
    }),
  );

  // session_velocity: High Betting Frequency
  rules.push(
    makeRule({
      id: "casino_session_velocity_high_frequency",
      name: "High Betting Frequency (Casino)",
      description:
        "More than 100 bets in 1 hour - potential automated or abusive play.",
      group: "stake_monitoring",
      severity: "medium",
      eventType: "casino_session",
      conditions: [
        { field: "bet_count_1h", operator: "greater_than", value: 100 },
      ],
      actions: [{ type: "createAlert" }, { type: "createCase" }],
    }),
  );

  // payment_cycling: Rapid deposit/withdrawal cycling
  rules.push(
    makeRule({
      id: "casino_payment_cycling_rapid",
      name: "Rapid Deposit Withdrawal Cycling",
      description:
        "Multiple deposits and withdrawals within 24h - potential payment cycling.",
      group: "deposit_structuring",
      severity: "high",
      eventType: "withdraw",
      conditions: conditionAnd([
        { field: "deposit_count_24h", operator: "greater_than", value: 3 },
        { field: "withdrawal_count_24h", operator: "greater_than", value: 2 },
      ]),
      actions: [{ type: "createAlert" }, { type: "createCase" }],
    }),
  );

  // multi_account_bonus: Shared Device Bonus Abuse
  rules.push(
    makeRule({
      id: "casino_multi_account_bonus_shared_device",
      name: "Shared Device Bonus Abuse",
      description:
        "Device appears to be used by multiple bonus-claiming accounts.",
      group: "multi_account",
      severity: "critical",
      eventType: "bonus_claim",
      conditions: conditionAnd([
        {
          field: "device_shared_accounts",
          operator: "greater_than",
          value: 2,
        },
        {
          field: "bonus_claim_count",
          operator: "greater_than",
          value: 0,
        },
      ]),
      actions: [
        { type: "createAlert" },
        { type: "createCase" },
        { type: "assignSegment", value: "multi_account_bonus" },
      ],
    }),
  );

  // Additional groups like opposite_betting, game_exploitation, chip_dumping
  // can be expressed similarly once the supporting metrics are available.

  return rules;
}

/**
 * Convenience helper to wire casino fraud rules into the engine.
 *
 * Call from application bootstrap (e.g. inside RiskEngineProvider) with the
 * current rules and the addRule function from RiskEngineContext.
 *
 * This does not alter the existing engines; it only registers additional
 * system rules in the fraud_abuse domain.
 */
export function initializeCasinoRiskEngine(
  addRule: (rule: Rule) => void,
  existingRules: Rule[] = [],
): void {
  const defaults = createDefaultCasinoRules();
  const existingIds = new Set(existingRules.map((r) => r.id));

  for (const rule of defaults) {
    if (!existingIds.has(rule.id)) {
      addRule(rule);
    }
  }
}

