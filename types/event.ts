export type EventCategory =
  | "Player"
  | "Sportsbook"
  | "Fraud"
  | "Compliance";

export interface Event {
  id: string;
  category: EventCategory;
  type: string;
  playerId?: string;
  createdAt: string;
  meta?: string;
}

