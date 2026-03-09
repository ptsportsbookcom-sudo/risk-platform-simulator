import type { Case } from "@/types/case";

export const mockCases: Case[] = [
  {
    id: "C-3001",
    title: "Possible bonus abuse via multi-accounting",
    playerId: "P-102938",
    owner: "risk.analyst@operator.io",
    status: "Investigating",
    openedAt: "2026-03-08T15:10:00Z",
    lastUpdatedAt: "2026-03-09T10:05:00Z",
    alertCount: 4,
    riskBand: "High",
  },
  {
    id: "C-3002",
    title: "Chargeback cluster - card ending *2291",
    playerId: "P-900221",
    owner: "fraud.lead@operator.io",
    status: "Assigned",
    openedAt: "2026-03-08T11:40:00Z",
    lastUpdatedAt: "2026-03-09T09:40:00Z",
    alertCount: 7,
    riskBand: "Severe",
  },
  {
    id: "C-3003",
    title: "Unusual sportsbook staking pattern",
    playerId: "P-548219",
    owner: "sports.risk@operator.io",
    status: "New",
    openedAt: "2026-03-09T08:15:00Z",
    lastUpdatedAt: "2026-03-09T08:15:00Z",
    alertCount: 2,
    riskBand: "Medium",
  },
];

