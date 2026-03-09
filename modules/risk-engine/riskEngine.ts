import type { RiskLevel } from "./riskScore";
import {
  type EngineEvent,
  type EngineEventType,
  type PlayerRiskSnapshot,
  type RuleEvaluation,
  type KycLevel,
  type AlertSeverity,
  evaluateRules,
} from "./ruleEngine";
import { updatePlayerSegments } from "../segmentation/segmentationEngine";
import type { Rule } from "./ruleTypes";
import { mockPlayers } from "@/data/mockPlayers";

export interface EngineAlert {
  id: string;
  playerId: string;
  ruleTriggered: string;
  severity: AlertSeverity;
  timestamp: string;
  status: "Open" | "Closed";
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

export interface EngineEventLogEntry {
  id: string;
  playerId: string;
  eventType: EngineEventType;
  timestamp: string;
  triggeredRules: string[];
  metadata?: Record<string, unknown>;
  amount?: number;
}

export interface PlayerRiskState extends PlayerRiskSnapshot {
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
  events: EngineEventLogEntry[];
  rules: Rule[];
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
    };
  }

  const rules: Rule[] = [];

  return {
    players,
    alerts: [],
    cases: [],
    bets: [],
    events: [],
    rules,
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

  const snapshotForRules: PlayerRiskSnapshot = {
    playerId: playerWithActivity.playerId,
    kycLevel: playerWithActivity.kycLevel,
    depositTimestamps: playerWithActivity.depositTimestamps,
    deviceIds: playerWithActivity.deviceIds ?? [],
    segments: playerWithActivity.segments ?? [],
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
  };

  const newAlerts: EngineAlert[] = [];
  const newCases: EngineCase[] = [];
  const newBets: EngineBet[] = [];
  const assignedSegmentsFromRules: string[] = [];

  for (const rule of ruleResults) {
    if (rule.createAlert && rule.alertSeverity) {
      const alert: EngineAlert = {
        id: nextId("ALERT"),
        playerId: event.playerId,
        ruleTriggered: rule.ruleId,
        severity: rule.alertSeverity,
        timestamp: event.timestamp,
        status: "Open",
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

    if (rule.openCase) {
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

  const mergedSegments = Array.from(
    new Set([
      ...((updatedPlayer.segments as string[] | undefined) ?? []),
      ...assignedSegmentsFromRules,
    ]),
  );

  const playerWithSegments: PlayerRiskState = {
    ...updatedPlayer,
    segments: updatePlayerSegments(
      { ...updatedPlayer, segments: mergedSegments },
      nextEvents,
    ),
  };

  const nextState: RiskEngineState = {
    players: {
      ...state.players,
      [event.playerId]: playerWithSegments,
    },
    alerts: [...state.alerts, ...newAlerts],
    cases: [...state.cases, ...newCases],
    bets: [...state.bets, ...newBets],
    events: nextEvents.slice(0, 100),
    rules: state.rules,
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
  const activeAlerts = state.alerts.filter((a) => a.status === "Open").length;
  const highRiskPlayers = Object.values(state.players).filter(
    (p) =>
      (p.segments ?? []).includes("High Risk") ||
      (p.segments ?? []).includes("Critical Risk"),
  ).length;
  const pendingCases = state.cases.filter((c) => c.status === "Open").length;
  const highRiskBets = state.bets.length;

  return {
    activeAlerts,
    highRiskPlayers,
    pendingCases,
    highRiskBets,
  };
}

