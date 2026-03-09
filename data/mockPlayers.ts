import type { Player } from "@/types/player";

export const mockPlayers: Player[] = [
  {
    id: "P-102938",
    name: "Alice Novak",
    country: "CZ",
    kycStatus: "Approved",
    cddTier: "Enhanced",
    lastActivity: "2026-03-09T10:24:00Z",
    balance: 1543.25,
    negativeBalance: false,
  },
  {
    id: "P-548219",
    name: "Marco Rossi",
    country: "IT",
    kycStatus: "Pending",
    cddTier: "Standard",
    lastActivity: "2026-03-09T09:14:00Z",
    balance: -120.5,
    negativeBalance: true,
  },
  {
    id: "P-774411",
    name: "Sophia Becker",
    country: "DE",
    kycStatus: "Approved",
    cddTier: "Simplified",
    lastActivity: "2026-03-09T08:52:00Z",
    balance: 230.0,
    negativeBalance: false,
  },
  {
    id: "P-900221",
    name: "James O'Connor",
    country: "IE",
    kycStatus: "Failed",
    cddTier: "Enhanced",
    lastActivity: "2026-03-09T10:42:00Z",
    balance: -540.75,
    negativeBalance: true,
  },
];

