import type { Segment } from "./segmentTypes";

export const DEFAULT_SEGMENTS: Segment[] = [
  { id: "vip", name: "VIP Player", createdAt: Date.now() },
  { id: "high_risk", name: "High Risk Player", createdAt: Date.now() },
  { id: "bonus_abuser", name: "Bonus Abuser", createdAt: Date.now() },
  {
    id: "multi_account",
    name: "Multi Account Risk",
    createdAt: Date.now(),
  },
  { id: "vpn_user", name: "VPN User", createdAt: Date.now() },
  { id: "aml_review", name: "AML Review", createdAt: Date.now() },

  // Additional segments already referenced by rules
  {
    id: "bonus_abuse_risk",
    name: "Bonus Abuse Risk",
    createdAt: Date.now(),
  },
  {
    id: "withdrawal_abuse",
    name: "Withdrawal Abuse",
    createdAt: Date.now(),
  },
  {
    id: "low_wagering_behavior",
    name: "Low Wagering Behaviour",
    createdAt: Date.now(),
  },
  {
    id: "multi_account_bonus",
    name: "Multi Account Bonus Abuse",
    createdAt: Date.now(),
  },
];

export const SEGMENT_ID_TO_NAME: Record<string, string> = DEFAULT_SEGMENTS.reduce(
  (acc, seg) => {
    acc[seg.id] = seg.name;
    return acc;
  },
  {} as Record<string, string>,
);

