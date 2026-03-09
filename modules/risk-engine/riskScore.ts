export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export const RISK_THRESHOLDS = {
  lowMax: 50,
  mediumMax: 150,
  highMax: 300,
} as const;

export function getRiskLevel(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.lowMax) return "Low";
  if (score <= RISK_THRESHOLDS.mediumMax) return "Medium";
  if (score <= RISK_THRESHOLDS.highMax) return "High";
  return "Critical";
}

export function clampScore(score: number): number {
  return Math.max(0, score);
}

