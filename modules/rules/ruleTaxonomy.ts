export const RULE_TAXONOMY = {
  sportsbook_trading: [
    "large_bet",
    "payout_exposure",
    "market_exposure",
    "odds_movement",
    "suspicious_betting",
  ],

  fraud_abuse: [
    "bonus_farming",
    "deposit_withdrawal_abuse",
    "low_wagering",
    "session_velocity",
    "payment_cycling",
    "multi_account",
    "vpn_usage",
    "device_fraud",
  ],

  aml_compliance: [
    "large_transaction",
    "deposit_structuring",
    "withdrawal_velocity",
    "suspicious_turnover",
    "manual_review",
  ],

  operations: ["player_control", "account_status", "manual_review", "bulk_action"],

  responsible_gambling: [
    "loss_chasing",
    "deposit_frequency",
    "long_session",
    "cool_off",
  ],
} as const;

export type RuleDomainKey = keyof typeof RULE_TAXONOMY;

