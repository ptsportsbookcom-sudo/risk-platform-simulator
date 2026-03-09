import type { Bet } from "@/types/bet";

export const mockHighRiskBets: Bet[] = [
  {
    id: "B-9011",
    playerId: "P-102938",
    playerName: "Alice Novak",
    vertical: "Sportsbook",
    market: "Champions League - Correct Score",
    stake: 2500,
    potentialWin: 18500,
    odds: "7.40",
    placedAt: "2026-03-09T10:18:00Z",
    highRisk: true,
  },
  {
    id: "B-9012",
    playerId: "P-548219",
    playerName: "Marco Rossi",
    vertical: "Casino",
    market: "High volatility slot - €50 spins",
    stake: 750,
    potentialWin: 42000,
    odds: "N/A",
    placedAt: "2026-03-09T09:55:00Z",
    highRisk: true,
  },
];

