import { getRiskLevel, clampScore, type RiskLevel } from "./riskScore";
import {
  type EngineEvent,
  type EngineEventType,
  type PlayerRiskSnapshot,
  type RuleEvaluation,
  type KycLevel,
  type AlertSeverity,
  evaluateRules,
} from "./ruleEngine";
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
  previousScore: number;
  newScore: number;
  riskDelta: number;
  triggeredRules: string[];
}

export interface PlayerRiskState extends PlayerRiskSnapshot {
  name: string;
  country: string;
  kycStatus: string;
  cddTier: string;
  lastActivity: string;
  balance: number;
  negativeBalance: boolean;
}

export interface RiskEngineState {
  players: Record<string, PlayerRiskState>;
  alerts: EngineAlert[];
  cases: EngineCase[];
  bets: EngineBet[];
  events: EngineEventLogEntry[];
}

export interface ProcessEventResult {
  state: RiskEngineState;
  triggeredRules: RuleEvaluation[];
  newAlerts: EngineAlert[];
  newCases: EngineCase[];
  previousScore: number;
  newScore: number;
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
    const riskScore = 0;
    const riskLevel: RiskLevel = getRiskLevel(riskScore);
    players[p.id] = {
      playerId: p.id,
      riskScore,
      riskLevel,
      kycLevel: toKycLevel(p.kycStatus),
      depositTimestamps: [],
      name: p.name,
      country: p.country,
      kycStatus: p.kycStatus,
      cddTier: p.cddTier,
      lastActivity: p.lastActivity,
      balance: p.balance,
      negativeBalance: p.negativeBalance,
    };
  }

  return {
    players,
    alerts: [],
    cases: [],
    bets: [],
    events: [],
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
      riskScore: 0,
      riskLevel: getRiskLevel(0),
      kycLevel: "KYC_0",
      depositTimestamps: [],
      name: `Simulated Player ${event.playerId}`,
      country: "XX",
      kycStatus: "Not Started",
      cddTier: "Standard",
      lastActivity: event.timestamp,
      balance: 0,
      negativeBalance: false,
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
    riskScore: playerWithActivity.riskScore,
    riskLevel: playerWithActivity.riskLevel,
    kycLevel: playerWithActivity.kycLevel,
    depositTimestamps: playerWithActivity.depositTimestamps,
  };

  const ruleResults = evaluateRules(event, snapshotForRules);

  const totalDelta = ruleResults.reduce((sum, r) => sum + r.delta, 0);
  const previousScore = baselinePlayer.riskScore;
  const newScore = clampScore(previousScore + totalDelta);
  const newRiskLevel = getRiskLevel(newScore);

  const updatedPlayer: PlayerRiskState = {
    ...playerWithActivity,
    riskScore: newScore,
    riskLevel: newRiskLevel,
  };

  const newAlerts: EngineAlert[] = [];
  const newCases: EngineCase[] = [];
  const newBets: EngineBet[] = [];

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
  }

  // Case creation when risk score crosses threshold (>150)
  if (
    previousScore <= 150 &&
    newScore > 150 &&
    !state.cases.some(
      (c) => c.playerId === event.playerId && c.status === "Open",
    )
  ) {
    const autoCase: EngineCase = {
      id: nextId("CASE"),
      playerId: event.playerId,
      alerts: newAlerts.map((a) => a.id),
      openedAt: event.timestamp,
      status: "Open",
    };
    newCases.push(autoCase);
  }

  const riskDelta = newScore - previousScore;
  const logEntry: EngineEventLogEntry = {
    id: event.id,
    playerId: event.playerId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    previousScore,
    newScore,
    riskDelta,
    triggeredRules: ruleResults.map((r) => r.ruleId),
  };

  const nextState: RiskEngineState = {
    players: {
      ...state.players,
      [event.playerId]: updatedPlayer,
    },
    alerts: [...state.alerts, ...newAlerts],
    cases: [...state.cases, ...newCases],
    bets: [...state.bets, ...newBets],
    events: [logEntry, ...state.events].slice(0, 100),
  };

  return {
    state: nextState,
    triggeredRules: ruleResults,
    newAlerts,
    newCases,
    previousScore,
    newScore,
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
    (p) => p.riskScore > 150,
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

