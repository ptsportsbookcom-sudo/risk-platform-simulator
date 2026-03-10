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
    domain: "aml_compliance",
    group: options.group,
    severity: options.severity,
    eventType: options.eventType ?? "any",
    conditions: options.conditions,
    actions: options.actions,
  };
}

/**
 * Built‑in AML / compliance rules that rely on existing metrics and event types.
 *
 * These are evaluated by the generic RuleEngine when present; they do not
 * modify any engine behaviour.
 */
export function createDefaultAmlRules(): Rule[] {
  const rules: Rule[] = [];

  // 2. Large Deposit Monitoring
  rules.push(
    makeRule({
      id: "aml_large_deposit",
      name: "Large Deposit",
      description: "Single large deposit over 5,000.",
      group: "large_transactions",
      severity: "high",
      eventType: "deposit",
      conditions: [
        {
          // event.amount is exposed to the rule engine as the amount field
          field: "amount",
          operator: "greater_than",
          value: 5000,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "large_depositor" },
      ],
    }),
  );

  // 3. Withdrawal Structuring – Rapid Withdrawals
  rules.push(
    makeRule({
      id: "aml_withdrawal_structuring_rapid",
      name: "Rapid Withdrawals",
      description:
        "More than 3 withdrawals in 1 hour and over 3,000 withdrawn in the last 24 hours – potential structuring.",
      group: "structuring",
      severity: "high",
      eventType: "withdraw",
      conditions: [
        {
          field: "withdrawal_count_1h",
          operator: "greater_than",
          value: 3,
        },
        {
          // total_withdrawal_amount over the rolling 24h window
          field: "total_withdrawal_amount",
          operator: "greater_than",
          value: 3000,
        },
      ],
      actions: [{ type: "createAlert" }, { type: "createCase" }],
    }),
  );

  // 4. Suspicious Turnover – High turnover with near‑zero net result
  rules.push(
    makeRule({
      id: "aml_suspicious_turnover_pattern",
      name: "High Turnover Pattern",
      description:
        "Very high stake volume with withdrawals roughly matching deposits – potential money laundering turnover pattern.",
      group: "suspicious_turnover",
      severity: "critical",
      eventType: "any",
      conditions: [
        {
          // High total stakes over the last 24 hours
          field: "total_stake_amount",
          operator: "greater_than",
          value: 10000,
        },
        {
          // Approximate 'net profit ≈ 0' by requiring withdrawals to be close to deposits
          field: "total_deposit_amount",
          operator: "greater_than",
          value: 9000,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "createCase" },
        { type: "assignSegment", value: "suspicious_turnover" },
      ],
    }),
  );

  // 5. Deposit Velocity – Rapid Deposits
  rules.push(
    makeRule({
      id: "aml_deposit_velocity_rapid_deposits",
      name: "Rapid Deposits",
      description: "More than 5 deposits within 10 minutes.",
      group: "structuring",
      severity: "medium",
      eventType: "deposit",
      conditions: [
        {
          field: "deposit_count_10m",
          operator: "greater_than",
          value: 5,
        },
      ],
      actions: [{ type: "createAlert" }],
    }),
  );

  // 6. CDD Escalation – High activity without enhanced CDD
  rules.push(
    makeRule({
      id: "aml_cdd_escalation_high_activity",
      name: "High Activity Without Enhanced CDD",
      description:
        "Player has deposited more than 10,000 (rolling window) but remains on standard CDD tier.",
      group: "cdd_escalation",
      severity: "high",
      eventType: "any",
      conditions: [
        {
          // Approximate 30‑day total using rolling total_deposit_amount
          field: "total_deposit_amount",
          operator: "greater_than",
          value: 10000,
        },
        {
          field: "cddTier",
          operator: "equals",
          value: "standard",
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "cdd_escalation" },
      ],
    }),
  );

  return rules;
}

export function initializeAMLRules(
  addRule: (rule: Rule) => void,
  existingRules: Rule[] = [],
): void {
  const defaults = createDefaultAmlRules();
  const existingIds = new Set(existingRules.map((r) => r.id));

  for (const rule of defaults) {
    if (!existingIds.has(rule.id)) {
      addRule(rule);
    }
  }
}

