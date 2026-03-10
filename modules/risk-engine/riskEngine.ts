import {
  type EngineEvent,
  type EngineEventType,
  type PlayerRiskSnapshot,
  type RuleEvaluation,
  type KycLevel,
  type AlertSeverity,
  evaluateRules,
} from "./ruleEngine";
import {
  computePlayerMetrics,
  emptyPlayerMetrics,
  type PlayerMetrics,
} from "../metrics/metricsEngine";
import type { Rule } from "./ruleTypes";
import { mockPlayers } from "@/data/mockPlayers";
import { SegmentationEngine, updatePlayerSegments } from "../segmentation/segmentationEngine";
import { DEFAULT_SEGMENTS } from "../segmentation/segmentRegistry";
import type { Segment } from "../segmentation/segmentTypes";

export interface EngineAlert {
  id: string;
  playerId: string;
  ruleTriggered: string;
  severity: AlertSeverity;
  timestamp: string; // kept for backwards compatibility (event time)
  createdAt: string;
  status: "open" | "investigating" | "resolved" | "dismissed" | "escalated";
  assignedTo?: string | null;
}

export interface EngineCase {
  id: string;
  playerId: string;
  alerts: string[];
  openedAt: string;
  status: "Open" | "Closed";
}

export interface EngineBet {
  id: string;
  playerId: string;
  eventId: string;
  timestamp: string;
  amount?: number;
}

export interface HighRiskBet {
  id: string;
  betId: string;
  playerId: string;
  eventName: string;
  market: string;
  stake: number;
  odds: number;
  possiblePayout: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "modified";
  createdAt: string;
}

export interface EngineEventLogEntry {
  id: string;
  playerId: string;
  eventType: EngineEventType;
  timestamp: string;
  triggeredRules: string[];
  metadata?: Record<string, unknown>;
  amount?: number;
}

export interface PlayerRiskState {
  playerId: string;
  kycLevel: KycLevel;
  depositTimestamps: string[];
  deviceIds: string[];
  segments: string[];
  metrics?: PlayerMetrics;
  name: string;
  country: string;
  kycStatus: string;
  cddTier: string;
  lastActivity: string;
  balance: number;
  negativeBalance: boolean;
  registrationDate: string;
  canDeposit: boolean;
  canWithdraw: boolean;
  isFrozen: boolean;
  accountStatus: "Active" | "Blocked" | "Frozen" | "Closed";
}

export interface RiskEngineState {
  players: Record<string, PlayerRiskState>;
  alerts: EngineAlert[];
  cases: EngineCase[];
  bets: EngineBet[];
  highRiskBets: HighRiskBet[];
  events: EngineEventLogEntry[];
  rules: Rule[];
  segments: Segment[];
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  playerId: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

export interface ProcessEventResult {
  state: RiskEngineState;
  triggeredRules: RuleEvaluation[];
  newAlerts: EngineAlert[];
  newCases: EngineCase[];
}

export type SimulatorEventInput = {
  playerId: string;
  eventType: EngineEventType;
  amount?: number;
  metadata?: Record<string, unknown>;
};

function toKycLevel(kycStatus: string): KycLevel {
  if (kycStatus === "Approved") return "KYC_2";
  if (kycStatus === "Pending") return "KYC_1";
  return "KYC_0";
}

export function createInitialState(): RiskEngineState {
  const players: Record<string, PlayerRiskState> = {};

  for (const p of mockPlayers) {
    players[p.id] = {
      playerId: p.id,
      kycLevel: toKycLevel(p.kycStatus),
      depositTimestamps: [],
      deviceIds: [],
      name: p.name,
      country: p.country,
      kycStatus: p.kycStatus,
      cddTier: p.cddTier,
      lastActivity: p.lastActivity,
      balance: p.balance,
      negativeBalance: p.negativeBalance,
      registrationDate: p.lastActivity,
      canDeposit: true,
      canWithdraw: true,
      isFrozen: false,
      accountStatus: "Active",
      segments: [],
      metrics: emptyPlayerMetrics(),
    };
  }

  const rules: Rule[] = [];
  const segments: Segment[] = DEFAULT_SEGMENTS;

  return {
    players,
    alerts: [],
    cases: [],
    bets: [],
    highRiskBets: [],
    events: [],
    rules,
    segments,
    auditLog: [],
  };
}

let engineSequence = 1;

function nextId(prefix: string): string {
  const id = `${prefix}-${engineSequence.toString().padStart(4, "0")}`;
  engineSequence += 1;
  return id;
}

export function processEvent(
  state: RiskEngineState,
  event: EngineEvent,
): ProcessEventResult {
  const existingPlayer = state.players[event.playerId];
  const baselinePlayer: PlayerRiskState =
    existingPlayer ?? {
      playerId: event.playerId,
      kycLevel: "KYC_0",
      depositTimestamps: [],
      deviceIds: [],
      name: `Simulated Player ${event.playerId}`,
      country: "XX",
      kycStatus: "Not Started",
      cddTier: "Standard",
      lastActivity: event.timestamp,
      balance: 0,
      negativeBalance: false,
      registrationDate: event.timestamp,
      canDeposit: true,
      canWithdraw: true,
      isFrozen: false,
      accountStatus: "Active",
      segments: [],
    };

  const player: PlayerRiskState =
    event.eventType === "deposit"
      ? {
          ...baselinePlayer,
          depositTimestamps: [
            ...baselinePlayer.depositTimestamps,
            event.timestamp,
          ],
        }
      : baselinePlayer;

  // Update last activity and simple KYC reaction
  const playerWithActivity: PlayerRiskState = {
    ...player,
    lastActivity: event.timestamp,
    kycStatus:
      event.eventType === "kyc_failure" ? "Failed" : player.kycStatus,
  };

  // Build a provisional event log (without triggered rules yet) to feed metrics
  const provisionalLog: EngineEventLogEntry = {
    id: event.id,
    playerId: event.playerId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    triggeredRules: [],
    metadata: event.metadata,
    amount: event.amount,
  };

  const provisionalEvents = [provisionalLog, ...state.events];
  const metrics = computePlayerMetrics(
    event.playerId,
    provisionalEvents,
    provisionalLog,
  );

  const snapshotForRules: PlayerRiskSnapshot = {
    playerId: playerWithActivity.playerId,
    kycLevel: playerWithActivity.kycLevel,
    depositTimestamps: playerWithActivity.depositTimestamps,
    deviceIds: playerWithActivity.deviceIds ?? [],
    segments: playerWithActivity.segments ?? [],
    metrics: metrics as unknown as { [metricName: string]: number },
  };

  const ruleResults = evaluateRules(event, snapshotForRules, state.rules ?? []);

  const deviceFromEvent = (event.metadata as { deviceId?: unknown } | undefined)
    ?.deviceId;
  let updatedDeviceIds = playerWithActivity.deviceIds ?? [];
  if (typeof deviceFromEvent === "string" && deviceFromEvent.length > 0) {
    if (!updatedDeviceIds.includes(deviceFromEvent)) {
      updatedDeviceIds = [...updatedDeviceIds, deviceFromEvent];
    }
  }

  const updatedPlayer: PlayerRiskState = {
    ...playerWithActivity,
    deviceIds: updatedDeviceIds,
    metrics,
  };

  const newAlerts: EngineAlert[] = [];
  const newCases: EngineCase[] = [];
  const newBets: EngineBet[] = [];
  const assignedSegmentsFromRules: string[] = [];
  const newHighRiskBets: HighRiskBet[] = [];

  for (const rule of ruleResults) {
    if (rule.createAlert && rule.alertSeverity) {
      const alert: EngineAlert = {
        id: nextId("ALERT"),
        playerId: event.playerId,
        ruleTriggered: rule.ruleId,
        severity: rule.alertSeverity,
        timestamp: event.timestamp,
        createdAt: event.timestamp,
        status: "open",
        assignedTo: null,
      };
      newAlerts.push(alert);

      // If this is a sportsbook large bet rule, register a high-risk bet.
      if (rule.ruleId === "R5_LARGE_BET") {
        const bet: EngineBet = {
          id: nextId("BET"),
          playerId: event.playerId,
          eventId: event.id,
          timestamp: event.timestamp,
          amount: event.amount,
        };
        newBets.push(bet);
      }
    }

    if (rule.createCase) {
      const caseRecord: EngineCase = {
        id: nextId("CASE"),
        playerId: event.playerId,
        alerts: newAlerts.map((a) => a.id),
        openedAt: event.timestamp,
        status: "Open",
      };
      newCases.push(caseRecord);
    }

    if (rule.assignSegments && rule.assignSegments.length > 0) {
      assignedSegmentsFromRules.push(...rule.assignSegments);
    }
  }

  // High-risk bet queue: any bet event that triggers at least one alert
  if (
    (event.eventType === "place_bet" ||
      event.eventType === "large_bet" ||
      event.eventType === "suspicious_bet") &&
    ruleResults.some((r) => r.createAlert)
  ) {
    const meta = (event.metadata ?? {}) as {
      eventName?: string;
      market?: string;
      odds?: number;
    };
    const stake = event.amount ?? 0;
    const odds = meta.odds ?? 1;
    const possiblePayout = stake * odds;
    const reason = ruleResults
      .filter((r) => r.createAlert)
      .map((r) => r.description)
      .join(", ");

    newHighRiskBets.push({
      id: nextId("HBET"),
      betId: event.id,
      playerId: event.playerId,
      eventName: meta.eventName ?? "UNKNOWN_EVENT",
      market: meta.market ?? "UNKNOWN_MARKET",
      stake,
      odds,
      possiblePayout,
      reason,
      status: "pending",
      createdAt: event.timestamp,
    });
  }

  const logEntry: EngineEventLogEntry = {
    id: event.id,
    playerId: event.playerId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    triggeredRules: ruleResults.map((r) => r.ruleId),
    metadata: event.metadata,
    amount: event.amount,
  };

  const nextEvents = [logEntry, ...state.events];

  // Segmentation: apply rule-assigned segments via the SegmentationEngine.
  const playersMap = new Map<string, PlayerRiskState>();
  playersMap.set(event.playerId, { ...updatedPlayer });
  const segmentationEngine = new SegmentationEngine(playersMap);

  // Ensure segments referenced by rules exist in registry; auto-create if needed.
  const existingSegmentIds = new Set((state.segments ?? []).map((s) => s.id));

  const newSegments: Segment[] = [];
  for (const seg of assignedSegmentsFromRules) {
    if (!existingSegmentIds.has(seg)) {
      existingSegmentIds.add(seg);
      newSegments.push({
        id: seg,
        name: seg,
        description: `System-created segment from rule assignment (${seg})`,
        domain: "fraud_abuse",
        createdAt: Date.now(),
      });
    }
    segmentationEngine.assignSegment(event.playerId, seg);
  }

  const finalSegments = updatePlayerSegments(
    {
      ...updatedPlayer,
      segments: segmentationEngine.getPlayerSegments(event.playerId),
    },
    nextEvents,
  );

  const playerWithSegments: PlayerRiskState = {
    ...updatedPlayer,
    segments: finalSegments,
  };

  const nextState: RiskEngineState = {
    players: {
      ...state.players,
      [event.playerId]: playerWithSegments,
    },
    alerts: [...state.alerts, ...newAlerts],
    cases: [...state.cases, ...newCases],
    bets: [...state.bets, ...newBets],
    highRiskBets: [...state.highRiskBets, ...newHighRiskBets],
    events: nextEvents.slice(0, 100),
    rules: state.rules,
    segments: [...(state.segments ?? []), ...newSegments],
    auditLog: state.auditLog,
  };

  return {
    state: nextState,
    triggeredRules: ruleResults,
    newAlerts,
    newCases,
  };
}

export function buildEngineEventFromSimulator(
  seq: number,
  input: SimulatorEventInput,
): EngineEvent {
  const id = `EV-${seq.toString().padStart(4, "0")}`;
  const timestamp = new Date().toISOString();
  return {
    id,
    playerId: input.playerId,
    eventType: input.eventType,
    amount: input.amount,
    timestamp,
    metadata: input.metadata,
  };
}

export function getDashboardStats(state: RiskEngineState) {
  const activeAlerts = state.alerts.filter((a) => a.status === "open").length;
  const investigatingAlerts = state.alerts.filter(
    (a) => a.status === "investigating",
  ).length;
  const highRiskPlayers = Object.values(state.players).filter(
    (p) =>
      (p.segments ?? []).includes("High Risk") ||
      (p.segments ?? []).includes("Critical Risk"),
  ).length;
  const pendingCases = state.cases.filter((c) => c.status === "Open").length;
  const highRiskBets = state.highRiskBets.filter(
    (b) => b.status === "pending",
  ).length;

  return {
    activeAlerts,
    investigatingAlerts,
    highRiskPlayers,
    pendingCases,
    highRiskBets,
  };
}

