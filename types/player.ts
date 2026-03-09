export type RiskScoreBand = "Low" | "Medium" | "High" | "Severe";

export type KycStatus = "Not Started" | "Pending" | "Approved" | "Failed";

export type CddTier = "Simplified" | "Standard" | "Enhanced";

export interface Player {
  id: string;
  name: string;
  country: string;
  riskScore: number;
  riskBand: RiskScoreBand;
  kycStatus: KycStatus;
  cddTier: CddTier;
  alertCount: number;
  lastActivity: string;
  balance: number;
  negativeBalance: boolean;
}

