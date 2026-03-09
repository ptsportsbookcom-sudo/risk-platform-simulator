export type KycStatus = "Not Started" | "Pending" | "Approved" | "Failed";

export type CddTier = "Simplified" | "Standard" | "Enhanced";

export interface Player {
  id: string;
  name: string;
  country: string;
  kycStatus: KycStatus;
  cddTier: CddTier;
  lastActivity: string;
  balance: number;
  negativeBalance: boolean;
}

