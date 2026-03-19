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
import { executeActions } from "./actionExecutor";
import { evaluateSegment } from "../segmentation/evaluateSegment";

export interface EngineAlert {
  id: string;
  playerId: string;
  ruleTriggered: string;
  severity: AlertSeverity;
  timestamp: string; // kept for backwards compatibility (event time)
  createdAt: string;
  status:
    | "open"
    | "investigating"
    | "resolved"
    | "dismissed"
    | "escalated"
    | "confirmed_fraud"
    | "false_positive"
    | "closed";
  assignedTo?: string | null;
  resolutionNote?: string | null;
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
  category?: string;
  blockedActions?: {
    deposit?: boolean;
    withdrawal?: boolean;
    gameplay?: boolean;
    betting?: boolean;
    bonus?: boolean;
  };
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
  // Lightweight sportsbook liability tracking
  playerLiability?: Record<string, number>;
  eventLiability?: Record<string, number>;
  marketLiability?: Record<string, number>;
}

export interface AuditEntry {
  id: string;
  playerId: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

import type { RuleAction } from "./ruleTypes";

export type ReviewQueue = "trading" | "casino" | "kyc";

export interface ProcessEventResult {
  state: RiskEngineState;
  triggeredRules: RuleEvaluation[];
  newAlerts: EngineAlert[];
  newCases: EngineCase[];
  actions: RuleAction[];
  reviewQueue?: ReviewQueue;
  reviewStatus?: "pending";
  betBlocked?: boolean;
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
      blockedActions: {},
    };
  }

  const rules: Rule[] = [];
  const segments: Segment[] = DEFAULT_SEGMENTS;

  // Initial registration-time segmentation for seeded players
  for (const [playerId, player] of Object.entries(players)) {
    const baseSegments = new Set(player.segments ?? []);

    for (const seg of segments) {
      const include = (seg.includePlayers ?? []).includes(playerId);
      const exclude = (seg.excludePlayers ?? []).includes(playerId);

      let shouldHave = baseSegments.has(seg.id);

      if (exclude) {
        shouldHave = false;
      } else if (include) {
        shouldHave = true;
      } else if (seg.type === "dynamic") {
        shouldHave = evaluateSegment(player, seg);
      }

      if (shouldHave) {
        baseSegments.add(seg.id);
      } else {
        baseSegments.delete(seg.id);
      }
    }

    players[playerId] = {
      ...player,
      segments: Array.from(baseSegments),
    };
  }

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
    playerLiability: {},
    eventLiability: {},
    marketLiability: {},
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
  const auditEntries: AuditEntry[] = [];

  const existingPlayer = state.players[event.playerId];
  const baselinePlayer: PlayerRiskState =
    existingPlayer ??
    (() => {
      const base: PlayerRiskState = {
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
        blockedActions: {},
      };

      const baseSegments = new Set(base.segments ?? []);
      for (const seg of state.segments ?? []) {
        const include = (seg.includePlayers ?? []).includes(event.playerId);
        const exclude = (seg.excludePlayers ?? []).includes(event.playerId);

        let shouldHave = baseSegments.has(seg.id);

        if (exclude) {
          shouldHave = false;
        } else if (include) {
          shouldHave = true;
        } else if (seg.type === "dynamic") {
          shouldHave = evaluateSegment(base, seg);
        }

        if (shouldHave) {
          baseSegments.add(seg.id);
        } else {
          baseSegments.delete(seg.id);
        }
      }

      return {
        ...base,
        segments: Array.from(baseSegments),
      };
    })();

  // Pre-rule event validation: enforce player restrictions before any metrics/rules/actions.
  const evType = event.eventType;
  const isDeposit = evType === "deposit";
  const isWithdraw = evType === "withdraw";
  const isBet =
    evType === "place_bet" ||
    evType === "large_bet" ||
    evType === "suspicious_bet";
  const isGameplay = evType === "casino_session";

  const isFinancialOrGameplay = isDeposit || isWithdraw || isBet || isGameplay;

  let shouldBlock = false;

  if (
    isFinancialOrGameplay &&
    (baselinePlayer.accountStatus === "Frozen" ||
      baselinePlayer.accountStatus === "Closed")
  ) {
    shouldBlock = true;
  }

  if (!shouldBlock && isDeposit && baselinePlayer.canDeposit === false) {
    shouldBlock = true;
  }

  if (!shouldBlock && isWithdraw && baselinePlayer.canWithdraw === false) {
    shouldBlock = true;
  }

  if (!shouldBlock && isBet && baselinePlayer.blockedActions?.betting) {
    shouldBlock = true;
  }

  if (!shouldBlock && isGameplay && baselinePlayer.blockedActions?.gameplay) {
    shouldBlock = true;
  }

  if (shouldBlock) {
    return {
      state,
      triggeredRules: [],
      newAlerts: [],
      newCases: [],
      actions: [],
      reviewQueue: undefined,
      reviewStatus: undefined,
      betBlocked: true,
    };
  }

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

  // Lightweight sportsbook liability tracking for bet events
  const metaForLiability = (event.metadata ?? {}) as {
    eventId?: string;
    eventName?: string;
    marketId?: string;
    market?: string;
    odds?: number;
  };
  let currentEventLiability = 0;
  let currentMarketLiability = 0;

  if (
    event.eventType === "place_bet" ||
    event.eventType === "large_bet" ||
    event.eventType === "suspicious_bet"
  ) {
    const stake = event.amount ?? 0;
    const odds = metaForLiability.odds ?? 1;
    const potentialPayout = stake * odds;
    const liability = potentialPayout - stake;

    const eventKey =
      metaForLiability.eventId ?? metaForLiability.eventName ?? "UNKNOWN_EVENT";
    const marketKey =
      metaForLiability.marketId ?? metaForLiability.market ?? "UNKNOWN_MARKET";

    const playerLiability = { ...(state.playerLiability ?? {}) };
    const eventLiability = { ...(state.eventLiability ?? {}) };
    const marketLiability = { ...(state.marketLiability ?? {}) };

    playerLiability[event.playerId] =
      (playerLiability[event.playerId] ?? 0) + liability;
    eventLiability[eventKey] = (eventLiability[eventKey] ?? 0) + liability;
    marketLiability[marketKey] = (marketLiability[marketKey] ?? 0) + liability;

    currentEventLiability = eventLiability[eventKey] ?? 0;
    currentMarketLiability = marketLiability[marketKey] ?? 0;

    state = {
      ...state,
      playerLiability,
      eventLiability,
      marketLiability,
    };
  }

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
  const allActions: RuleAction[] = [];
  let reviewQueue: ReviewQueue | undefined;
  let betBlocked = false;
  let cumulativePlayerUpdates: Partial<PlayerRiskState> = {};

  const snapshotForRules: PlayerRiskSnapshot = {
    playerId: playerWithActivity.playerId,
    kycLevel: playerWithActivity.kycLevel,
    depositTimestamps: playerWithActivity.depositTimestamps,
    deviceIds: playerWithActivity.deviceIds ?? [],
    segments: playerWithActivity.segments ?? [],
    metrics: {
      ...(metrics as unknown as { [metricName: string]: number }),
      player_liability:
        (state.playerLiability ?? {})[event.playerId] ?? 0,
      event_liability: currentEventLiability,
      market_liability: currentMarketLiability,
    },
  };

  const ruleResults = evaluateRules(event, snapshotForRules, state.rules ?? []);

  // Audit: rules triggered
  for (const r of ruleResults) {
    auditEntries.push({
      id: nextId("AUDIT"),
      playerId: event.playerId,
      action: `Rule triggered: ${r.ruleId}`,
      performedBy: "system",
      timestamp: event.timestamp,
    });
  }

  // Process rules: maintain backwards compatibility while supporting new actions
  for (const rule of ruleResults) {
    // Collect all actions from this rule
    const ruleActions = rule.actions ?? [];
    const ruleAlerts: EngineAlert[] = [];

    // Maintain backwards compatibility: handle legacy createAlert/createCase/assignSegments
    if (rule.createAlert) {
      // If rule has actions, use ActionExecutor; otherwise use legacy path
      if (ruleActions.length > 0) {
        const actionResult = executeActions(
          ruleActions,
          event.playerId,
          rule.ruleId,
          event.timestamp,
          rule.alertSeverity ?? "Medium",
          state,
          nextId,
        );
        newAlerts.push(...actionResult.alerts);
        ruleAlerts.push(...actionResult.alerts);
        newCases.push(...actionResult.cases);
        for (const created of actionResult.alerts) {
          auditEntries.push({
            id: nextId("AUDIT"),
            playerId: created.playerId,
            action: `Alert created: ${created.ruleTriggered}`,
            performedBy: "system",
            timestamp: created.createdAt,
          });
        }
        for (const created of actionResult.cases) {
          auditEntries.push({
            id: nextId("AUDIT"),
            playerId: created.playerId,
            action: `Case created: ${created.id}`,
            performedBy: "system",
            timestamp: created.openedAt,
          });
        }
        allActions.push(...actionResult.recordedActions);
        cumulativePlayerUpdates = {
          ...cumulativePlayerUpdates,
          ...actionResult.playerUpdates,
        };
        if (actionResult.reviewQueue && !reviewQueue) {
          reviewQueue = actionResult.reviewQueue;
        }
        if (actionResult.betBlocked) {
          betBlocked = true;
        }
      } else {
        // Legacy path: create alert directly
        const alert: EngineAlert = {
          id: nextId("ALERT"),
          playerId: event.playerId,
          ruleTriggered: rule.ruleId,
          severity: rule.alertSeverity ?? "Medium",
          timestamp: event.timestamp,
          createdAt: event.timestamp,
          status: "open",
          assignedTo: null,
        };
        newAlerts.push(alert);
        ruleAlerts.push(alert);
        auditEntries.push({
          id: nextId("AUDIT"),
          playerId: alert.playerId,
          action: `Alert created: ${alert.ruleTriggered}`,
          performedBy: "system",
          timestamp: alert.createdAt,
        });
      }

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
    } else if (ruleActions.length > 0) {
      // Rule has actions but no legacy createAlert - execute actions directly
      const actionResult = executeActions(
        ruleActions,
        event.playerId,
        rule.ruleId,
        event.timestamp,
        rule.alertSeverity ?? "Medium",
        state,
        nextId,
      );
      newAlerts.push(...actionResult.alerts);
      ruleAlerts.push(...actionResult.alerts);
      newCases.push(...actionResult.cases);
      allActions.push(...actionResult.recordedActions);
      cumulativePlayerUpdates = {
        ...cumulativePlayerUpdates,
        ...actionResult.playerUpdates,
      };
      if (actionResult.reviewQueue && !reviewQueue) {
        reviewQueue = actionResult.reviewQueue;
      }
      if (actionResult.betBlocked) {
        betBlocked = true;
      }
    }

    // Legacy createCase handling (if not already handled by actions)
    if (rule.createCase && !ruleActions.some((a) => a.type === "createCase")) {
      const caseRecord: EngineCase = {
        id: nextId("CASE"),
        playerId: event.playerId,
        alerts: ruleAlerts.map((a) => a.id),
        openedAt: event.timestamp,
        status: "Open",
      };
      newCases.push(caseRecord);
      auditEntries.push({
        id: nextId("AUDIT"),
        playerId: caseRecord.playerId,
        action: `Case created: ${caseRecord.id}`,
        performedBy: "system",
        timestamp: caseRecord.openedAt,
      });
    }

    // Legacy assignSegments handling (if not already handled by actions)
    if (rule.assignSegments && rule.assignSegments.length > 0) {
      assignedSegmentsFromRules.push(...rule.assignSegments);
    }

    // Extract assignSegment actions
    for (const action of ruleActions) {
      if (action.type === "assignSegment") {
        assignedSegmentsFromRules.push(action.value);
      }
    }
  }

  // High-risk bet queue: only when explicitly routed to trading review
  if (
    reviewQueue === "trading" &&
    (event.eventType === "place_bet" ||
      event.eventType === "large_bet" ||
      event.eventType === "suspicious_bet")
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

  // Apply action-based player updates
  const playerWithActions: PlayerRiskState = {
    ...updatedPlayer,
    segments: finalSegments,
    ...cumulativePlayerUpdates,
    // Merge blockedActions if they exist
    blockedActions: cumulativePlayerUpdates.blockedActions
      ? {
          ...(updatedPlayer.blockedActions ?? {}),
          ...cumulativePlayerUpdates.blockedActions,
        }
      : updatedPlayer.blockedActions,
  };

  const playerWithSegments: PlayerRiskState = playerWithActions;

  // Audit: player updates (status, payment controls, blocks, segments)
  const before = updatedPlayer;
  const after = playerWithSegments;

  if (before.accountStatus !== after.accountStatus) {
    auditEntries.push({
      id: nextId("AUDIT"),
      playerId: event.playerId,
      action: "Account status updated",
      performedBy: "system",
      timestamp: event.timestamp,
    });
  }

  if (
    before.canDeposit !== after.canDeposit ||
    before.canWithdraw !== after.canWithdraw
  ) {
    auditEntries.push({
      id: nextId("AUDIT"),
      playerId: event.playerId,
      action: "Payment restriction applied",
      performedBy: "system",
      timestamp: event.timestamp,
    });
  }

  const beforeBlocked = before.blockedActions ?? {};
  const afterBlocked = after.blockedActions ?? {};
  if (
    beforeBlocked.deposit !== afterBlocked.deposit ||
    beforeBlocked.withdrawal !== afterBlocked.withdrawal ||
    beforeBlocked.gameplay !== afterBlocked.gameplay ||
    beforeBlocked.bonus !== afterBlocked.bonus ||
    beforeBlocked.betting !== afterBlocked.betting
  ) {
    auditEntries.push({
      id: nextId("AUDIT"),
      playerId: event.playerId,
      action: "Player action blocked",
      performedBy: "system",
      timestamp: event.timestamp,
    });
  }

  const beforeSegments = new Set(before.segments ?? []);
  const afterSegments = new Set(after.segments ?? []);
  let segmentsChanged = false;
  if (beforeSegments.size !== afterSegments.size) {
    segmentsChanged = true;
  } else {
    for (const seg of beforeSegments) {
      if (!afterSegments.has(seg)) {
        segmentsChanged = true;
        break;
      }
    }
  }
  if (segmentsChanged) {
    auditEntries.push({
      id: nextId("AUDIT"),
      playerId: event.playerId,
      action: "Segment assigned",
      performedBy: "system",
      timestamp: event.timestamp,
    });
  }

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
    auditLog: [...state.auditLog, ...auditEntries],
  };

  return {
    state: nextState,
    triggeredRules: ruleResults,
    newAlerts,
    newCases,
    actions: allActions,
    reviewQueue,
    reviewStatus: reviewQueue ? "pending" : undefined,
    betBlocked,
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
      (p.segments ?? []).includes("high_risk") ||
      (p.segments ?? []).includes("critical_risk"),
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

