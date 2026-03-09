export type BetVertical = "Sportsbook" | "Casino";

export interface Bet {
  id: string;
  playerId: string;
  playerName: string;
  vertical: BetVertical;
  market: string;
  stake: number;
  potentialWin: number;
  odds: string;
  placedAt: string;
  highRisk: boolean;
}

