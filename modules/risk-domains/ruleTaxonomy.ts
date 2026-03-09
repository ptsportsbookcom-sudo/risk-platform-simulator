export const RULE_TAXONOMY = {
  sportsbook_trading: {
    large_bet: ["large_bet", "place_bet"],
    payout_exposure: ["place_bet"],
    arbitrage: ["suspicious_bet"],
    market_exposure: ["place_bet"],
  },

  fraud_abuse: {
    multi_account: ["login", "player_created"],
    vpn_usage: ["login"],
    device_fraud: ["login"],
    payment_cycling: ["deposit", "withdraw"],
  },

  aml_compliance: {
    transaction_monitoring: ["deposit", "withdraw"],
    withdrawal_velocity: ["withdraw"],
    manual_review: ["deposit", "withdraw"],
  },

  casino_risk: {
    bonus_farming: ["bonus_claim"],
    chip_dumping: ["casino_session"],
    session_velocity: ["casino_session"],
  },
} as const;

export type TaxonomyDomain = keyof typeof RULE_TAXONOMY;

