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
    domain: "fraud_abuse",
    group: options.group,
    severity: options.severity,
    eventType: options.eventType ?? "any",
    conditions: options.conditions,
    actions: options.actions,
  };
}

/**
 * Built‑in fraud / abuse rules that rely on existing metrics and event types.
 *
 * These rules do not change engine behaviour; they are just system rules that
 * the generic RuleEngine will evaluate when present in the rules array.
 */
export function createDefaultFraudRules(): Rule[] {
  const rules: Rule[] = [];

  // 2. Multiple Accounts Same Device
  rules.push(
    makeRule({
      id: "fraud_multi_account_same_device",
      name: "Multiple Accounts Same Device",
      description:
        "More than 3 distinct accounts appear on the same device / IP within 1 hour.",
      group: "multi_account",
      severity: "high",
      eventType: "login",
      conditions: [
        {
          // Assumes a time‑window metric such as device_count_per_ip_1h
          field: "device_count_per_ip_1h",
          operator: "greater_than",
          value: 3,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "multi_account_cluster" },
      ],
    }),
  );

  // 3. VPN Risk Detection
  rules.push(
    makeRule({
      id: "fraud_vpn_login",
      name: "VPN Login",
      description: "Login from a VPN endpoint.",
      group: "device_risk",
      severity: "medium",
      eventType: "vpn_login",
      conditions: [
        {
          field: "eventType",
          operator: "equals",
          value: "vpn_login",
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "vpn_user" },
      ],
    }),
  );

  // 4. Device Sharing – Multiple device logins
  rules.push(
    makeRule({
      id: "fraud_multiple_device_logins",
      name: "Multiple Device Logins",
      description:
        "Player is using many different devices in a 24 hour period – possible account sharing.",
      group: "device_risk",
      severity: "medium",
      eventType: "multi_device_login",
      conditions: [
        {
          field: "device_count_last_24h",
          operator: "greater_than",
          value: 5,
        },
      ],
      actions: [{ type: "createAlert" }],
    }),
  );

  // 5. Payment Cycling – Rapid deposit / withdraw pattern
  rules.push(
    makeRule({
      id: "fraud_payment_cycling_rapid_pattern",
      name: "Rapid Deposit Withdraw Pattern",
      description:
        "More than 3 deposits and 2 withdrawals in 1 hour – potential payment cycling.",
      group: "payment_abuse",
      severity: "high",
      eventType: "withdraw",
      conditions: [
        {
          field: "deposit_count_1h",
          operator: "greater_than",
          value: 3,
        },
        {
          field: "withdrawal_count_1h",
          operator: "greater_than",
          value: 2,
        },
      ],
      actions: [{ type: "createAlert" }, { type: "createCase" }],
    }),
  );

  // 6. Chargeback Risk
  rules.push(
    makeRule({
      id: "fraud_chargeback_detected",
      name: "Chargeback Detected",
      description: "Chargeback reported for this player.",
      group: "payment_abuse",
      severity: "critical",
      eventType: "chargeback",
      conditions: [
        {
          field: "eventType",
          operator: "equals",
          value: "chargeback",
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "chargeback_player" },
        { type: "createCase" },
      ],
    }),
  );

  // 7. Bonus Farming – Deposit / withdraw without gameplay
  rules.push(
    makeRule({
      id: "fraud_bonus_farming_deposit_withdraw_no_gameplay",
      name: "Deposit Withdraw No Gameplay",
      description:
        "Player deposits a significant amount, does not place bets, and requests withdrawal – potential bonus farming.",
      group: "bonus_abuse",
      severity: "high",
      eventType: "withdraw",
      conditions: [
        {
          field: "deposit_amount",
          operator: "greater_than",
          value: 100,
        },
        {
          field: "bet_count_24h",
          operator: "equals",
          value: 0,
        },
        {
          field: "withdrawal_requested",
          operator: "equals",
          value: true,
        },
      ],
      actions: [
        { type: "createAlert" },
        { type: "assignSegment", value: "bonus_abuse_risk" },
      ],
    }),
  );

  // 8. Session Velocity – High session frequency
  rules.push(
    makeRule({
      id: "fraud_session_velocity_high_frequency",
      name: "High Session Frequency",
      description:
        "More than 10 sessions started in 1 hour – suspicious account automation or botting.",
      group: "session_abuse",
      severity: "medium",
      eventType: "casino_session",
      conditions: [
        {
          field: "session_count_1h",
          operator: "greater_than",
          value: 10,
        },
      ],
      actions: [{ type: "createAlert" }],
    }),
  );

  return rules;
}

/**
 * Helper for wiring these rules into the engine at startup without changing
 * core engine code. Given the current rules and an addRule callback, it will
 * add any missing fraud rules by id.
 */
export function initializeFraudRules(
  addRule: (rule: Rule) => void,
  existingRules: Rule[] = [],
): void {
  const defaults = createDefaultFraudRules();
  const existingIds = new Set(existingRules.map((r) => r.id));

  for (const rule of defaults) {
    if (!existingIds.has(rule.id)) {
      addRule(rule);
    }
  }
}

