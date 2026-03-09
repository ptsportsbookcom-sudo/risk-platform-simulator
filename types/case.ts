export type CaseStatus =
  | "New"
  | "Assigned"
  | "Investigating"
  | "Awaiting Docs"
  | "Closed - Fraud"
  | "Closed - No Issue";

export interface Case {
  id: string;
  title: string;
  playerId: string;
  owner: string;
  status: CaseStatus;
  openedAt: string;
  lastUpdatedAt: string;
  alertCount: number;
  riskBand: "Low" | "Medium" | "High" | "Severe";
}

