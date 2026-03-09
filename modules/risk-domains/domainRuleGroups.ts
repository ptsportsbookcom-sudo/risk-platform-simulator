export const DOMAIN_RULE_GROUPS = {
  sportsbook_risk: [
    "large_bet",
    "payout_exposure",
    "odds_manipulation",
    "arbitrage",
    "market_exposure",
  ],

  casino_risk: [
    "bonus_farming",
    "chip_dumping",
    "session_velocity",
    "game_exploitation",
    "low_wagering",
  ],

  fraud_abuse: [
    "multi_account",
    "device_fraud",
    "vpn_usage",
    "payment_cycling",
  ],

  aml_compliance: [
    "transaction_monitoring",
    "withdrawal_velocity",
    "manual_review",
  ],

  responsible_gambling: [
    "loss_chasing",
    "session_duration",
    "deposit_frequency",
  ],
} as const;

export type DomainKey = keyof typeof DOMAIN_RULE_GROUPS;

