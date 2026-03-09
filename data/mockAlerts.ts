import type { Alert } from "@/types/alert";

export const mockAlerts: Alert[] = [
  {
    id: "A-5001",
    ruleName: "Rapid deposits from new device",
    playerId: "P-102938",
    playerName: "Alice Novak",
    severity: "High",
    createdAt: "2026-03-09T10:20:00Z",
    status: "Open",
  },
  {
    id: "A-5002",
    ruleName: "Multiple failed KYC attempts",
    playerId: "P-900221",
    playerName: "James O'Connor",
    severity: "Critical",
    createdAt: "2026-03-09T09:50:00Z",
    status: "Escalated",
  },
  {
    id: "A-5003",
    ruleName: "High velocity withdrawals",
    playerId: "P-548219",
    playerName: "Marco Rossi",
    severity: "Medium",
    createdAt: "2026-03-09T09:10:00Z",
    status: "In Review",
  },
  {
    id: "A-5004",
    ruleName: "VPN / Proxy usage",
    playerId: "P-774411",
    playerName: "Sophia Becker",
    severity: "Low",
    createdAt: "2026-03-09T08:30:00Z",
    status: "Closed",
  },
];

