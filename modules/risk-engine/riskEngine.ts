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

export interface PlayerRiskState extends PlayerRiskSnapshot {}

export interface RiskEngineState {
  players: Record<string, PlayerRiskState>;
  alerts: EngineAlert[];
  cases: EngineCase[];
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
    };
  }

  return {
    players,
    alerts: [],
    cases: [],
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
    };

  const player: PlayerRiskSnapshot =
    event.eventType === "deposit"
      ? {
          ...baselinePlayer,
          depositTimestamps: [
            ...baselinePlayer.depositTimestamps,
            event.timestamp,
          ],
        }
      : baselinePlayer;

  const ruleResults = evaluateRules(event, player);

  const totalDelta = ruleResults.reduce((sum, r) => sum + r.delta, 0);
  const previousScore = baselinePlayer.riskScore;
  const newScore = clampScore(previousScore + totalDelta);
  const newRiskLevel = getRiskLevel(newScore);

  const updatedPlayer: PlayerRiskState = {
    ...player,
    riskScore: newScore,
    riskLevel: newRiskLevel,
  };

  const newAlerts: EngineAlert[] = [];
  const newCases: EngineCase[] = [];

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
    }

    if (rule.createCase) {
      const caseRecord: EngineCase = {
        id: nextId("CASE"),
        playerId: event.playerId,
        alerts: [],
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
      alerts: [],
      openedAt: event.timestamp,
      status: "Open",
    };
    newCases.push(autoCase);
  }

  const nextState: RiskEngineState = {
    players: {
      ...state.players,
      [event.playerId]: updatedPlayer,
    },
    alerts: [...state.alerts, ...newAlerts],
    cases: [...state.cases, ...newCases],
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
    (p) => p.riskLevel === "High" || p.riskLevel === "Critical",
  ).length;
  const pendingCases = state.cases.filter((c) => c.status === "Open").length;

  return {
    activeAlerts,
    highRiskPlayers,
    pendingCases,
  };
}

