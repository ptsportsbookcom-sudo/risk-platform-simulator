export type AlertSeverity = "Low" | "Medium" | "High" | "Critical";

export type AlertStatus = "Open" | "In Review" | "Escalated" | "Closed";

export interface Alert {
  id: string;
  ruleName: string;
  playerId: string;
  playerName: string;
  severity: AlertSeverity;
  createdAt: string;
  status: AlertStatus;
}

