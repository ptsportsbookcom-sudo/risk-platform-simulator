import type { EngineEventType } from "../risk-engine/ruleEngine";
import type {
  Rule,
  RuleConditions,
  RuleGroup,
  RuleSeverity,
} from "../risk-engine/ruleTypes";

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
    domain: "responsible_gambling",
    group: options.group,
    severity: options.severity,
    eventType: options.eventType ?? "any",
    conditions: options.conditions,
    actions: options.actions,
  };
}

/**
 * Built-in Responsible Gambling rules using existing metrics and fields.
 * These are evaluated by the generic RuleEngine and do not modify core engines.
 */
export function createDefaultRGRules(): Rule[] {
  const rules: Rule[] = [];

  // 2. Loss Chasing Detection – approximate via high recent betting + net outflow
  rules.push(
    makeRule({
      id: "rg_loss_chasing_consecutive_losses",
      name: "Consecutive Loss Pattern",
      description:
        "High betting frequency with significant net outflow over the last 24h – potential loss chasing.",
      group: "loss_chasing",
      severity: "medium",
      eventType: "place_bet",
      conditions: [
        {
          // Use total_deposit_amount as a proxy for loss_amount_24h
          field: "total_deposit_amount",
          operator: "greater_than",
          value: 500,
        },
        {
          field: "bet_count_1h",
          operator: "greater_than",
          value: 10,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "loss_chasing" },
      ],
    }),
  );

  // 3. Deposit Escalation – approximate rapid increase with high 24h deposits
  rules.push(
    makeRule({
      id: "rg_deposit_escalation_rapid_increase",
      name: "Rapid Deposit Increase",
      description:
        "Significant increase in deposits within a short period – potential escalation of gambling behaviour.",
      group: "deposit_escalation",
      severity: "high",
      eventType: "deposit",
      conditions: [
        {
          field: "deposit_count_24h",
          operator: "greater_than",
          value: 3,
        },
        {
          field: "total_deposit_amount",
          operator: "greater_than",
          value: 2000,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "deposit_escalation" },
      ],
    }),
  );

  // 4. Long Session Monitoring – approximate extended play by high session counts
  rules.push(
    makeRule({
      id: "rg_long_sessions_extended_gambling",
      name: "Extended Gambling Session",
      description:
        "Many sessions started in a short period – proxy for very long or continuous play.",
      group: "long_sessions",
      severity: "medium",
      eventType: "casino_session",
      conditions: [
        {
          // If there are more than 6 sessions in 30 minutes, treat as extended play
          field: "session_count_30m",
          operator: "greater_than",
          value: 6,
        },
      ],
      actions: [{ type: "createAlert" }],
    }),
  );

  // 5. Affordability Risk – approximate 7d with rolling totals
  rules.push(
    makeRule({
      id: "rg_affordability_high_spend_relative_to_activity",
      name: "Affordability Risk – High Spend",
      description:
        "High net spend relative to withdrawals – potential affordability concern.",
      group: "affordability",
      severity: "high",
      eventType: "any",
      conditions: [
        {
          field: "total_deposit_amount",
          operator: "greater_than",
          value: 2000,
        },
        {
          // Require withdrawals to be significantly lower than deposits
          field: "total_withdrawal_amount",
          operator: "less_than",
          value: 1000,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "createCase" },
        { type: "assignSegment", value: "affordability_risk" },
      ],
    }),
  );

  // 6. Cool-Off Trigger – approximate multiple RG events via intense short-term activity
  rules.push(
    makeRule({
      id: "rg_cool_off_multiple_signals_short_period",
      name: "Cool-Off Trigger",
      description:
        "Very high recent deposit and betting activity – recommend cool-off.",
      group: "cool_off",
      severity: "critical",
      eventType: "any",
      conditions: [
        {
          field: "deposit_count_10m",
          operator: "greater_than",
          value: 5,
        },
        {
          field: "bet_count_10m",
          operator: "greater_than",
          value: 20,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "cool_off_required" },
      ],
    }),
  );

  return rules;
}

export function initializeRGRules(
  addRule: (rule: Rule) => void,
  existingRules: Rule[] = [],
): void {
  const defaults = createDefaultRGRules();
  const existingIds = new Set(existingRules.map((r) => r.id));

  for (const rule of defaults) {
    if (!existingIds.has(rule.id)) {
      addRule(rule);
    }
  }
}

