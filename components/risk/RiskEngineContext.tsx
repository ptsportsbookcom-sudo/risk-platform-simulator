"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  type RiskEngineState,
  type SimulatorEventInput,
  type ProcessEventResult,
  type PlayerRiskState,
  type HighRiskBet,
  type AuditEntry,
  createInitialState,
  processEvent,
  buildEngineEventFromSimulator,
  getDashboardStats,
} from "@/modules/risk-engine";
import { createDefaultFraudRules } from "@/modules/fraud/fraudRules";
import { createDefaultAmlRules } from "@/modules/aml/amlRules";
import { createDefaultRGRules } from "@/modules/rg/rgRules";
import type { Rule } from "@/modules/risk-engine/ruleTypes";
import type { Segment } from "@/modules/segmentation/segmentTypes";
import { evaluateSegment } from "@/modules/segmentation/evaluateSegment";

type RiskEngineAction =
  | { type: "COMMIT"; payload: { state: RiskEngineState; sequence: number } }
  | {
      type: "UPDATE_PLAYER";
      payload: { playerId: string; patch: Partial<PlayerRiskState> };
    }
  | { type: "ADD_RULE"; payload: Rule }
  | { type: "TOGGLE_RULE"; payload: { id: string } }
  | { type: "UPDATE_RULE"; payload: { id: string; updates: Partial<Rule> } }
  | { type: "REMOVE_RULE"; payload: { id: string } }
  | { type: "CREATE_SEGMENT"; payload: Segment }
  | { type: "UPDATE_SEGMENT"; payload: { id: string; updates: Partial<Segment> } }
  | { type: "DELETE_SEGMENT"; payload: { id: string } }
  | {
      type: "ASSIGN_SEGMENT_TO_PLAYER";
      payload: { playerId: string; segmentId: string };
    }
  | {
      type: "REMOVE_SEGMENT_FROM_PLAYER";
      payload: { playerId: string; segmentId: string };
    }
  | { type: "RESET" };

interface RiskEngineContextValue {
  state: RiskEngineState;
  sequence: number;
  processSimulatorEvent: (input: SimulatorEventInput) => ProcessEventResult;
  updatePlayerStatus: (
    playerId: string,
    patch: Partial<PlayerRiskState>,
  ) => void;
  addRule: (rule: Rule) => void;
  toggleRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  createSegment: (segment: Segment) => void;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  deleteSegment: (id: string) => void;
  assignSegmentToPlayer: (playerId: string, segmentId: string) => void;
  removeSegmentFromPlayer: (playerId: string, segmentId: string) => void;
  updateHighRiskBet: (
    betId: string,
    patch: {
      stake?: number;
      odds?: number;
      status?: "pending" | "approved" | "rejected" | "modified";
    },
  ) => void;
  addHighRiskBet: (bet: HighRiskBet) => void;
  approveHighRiskBet: (id: string) => void;
  rejectHighRiskBet: (id: string) => void;
  modifyHighRiskBet: (id: string, updates: { stake?: number; odds?: number }) => void;
  resolveAlert: (alertId: string) => void;
  closeCase: (caseId: string) => void;
  assignAlert: (alertId: string, analyst: string | null) => void;
  updateAlertStatus: (
    alertId: string,
    status:
      | "open"
      | "investigating"
      | "resolved"
      | "dismissed"
      | "escalated"
      | "confirmed_fraud"
      | "false_positive"
      | "closed",
    resolutionNote?: string,
  ) => void;
  escalateAlertToCase: (alertId: string, title?: string) => void;
  reset: () => void;
  logAudit: (entry: AuditEntry) => void;
}

function reducer(
  current: { state: RiskEngineState; sequence: number },
  action: RiskEngineAction,
): { state: RiskEngineState; sequence: number } {
  switch (action.type) {
    case "COMMIT":
      return {
        state: action.payload.state,
        sequence: action.payload.sequence,
      };
    case "UPDATE_PLAYER": {
      const existing = current.state.players[action.payload.playerId];
      if (!existing) return current;
      return {
        state: {
          ...current.state,
          players: {
            ...current.state.players,
            [action.payload.playerId]: {
              ...existing,
              ...action.payload.patch,
            },
          },
        },
        sequence: current.sequence,
      };
    }
    case "ADD_RULE":
      return {
        state: {
          ...current.state,
          rules: [...(current.state.rules ?? []), action.payload],
        },
        sequence: current.sequence,
      };
    case "TOGGLE_RULE":
      return {
        state: {
          ...current.state,
          rules: (current.state.rules ?? []).map((r) =>
            r.id === action.payload.id ? { ...r, enabled: !r.enabled } : r,
          ),
        },
        sequence: current.sequence,
      };
    case "UPDATE_RULE":
      return {
        state: {
          ...current.state,
          rules: (current.state.rules ?? []).map((r) =>
            r.id === action.payload.id ? { ...r, ...action.payload.updates } : r,
          ),
        },
        sequence: current.sequence,
      };
    case "REMOVE_RULE":
      return {
        state: {
          ...current.state,
          rules: (current.state.rules ?? []).filter(
            (r) => r.id !== action.payload.id,
          ),
        },
        sequence: current.sequence,
      };
    case "CREATE_SEGMENT":
      return {
        state: {
          ...current.state,
          segments: [...(current.state.segments ?? []), action.payload],
        },
        sequence: current.sequence,
      };
    case "UPDATE_SEGMENT":
      return {
        state: {
          ...current.state,
          segments: (current.state.segments ?? []).map((s) =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s,
          ),
        },
        sequence: current.sequence,
      };
    case "DELETE_SEGMENT": {
      const remaining = (current.state.segments ?? []).filter(
        (s) => s.id !== action.payload.id,
      );
      const updatedPlayers: RiskEngineState["players"] = {};
      for (const [id, player] of Object.entries(current.state.players)) {
        updatedPlayers[id] = {
          ...player,
          segments: (player.segments ?? []).filter(
            (seg) => seg !== action.payload.id,
          ),
        };
      }
      return {
        state: {
          ...current.state,
          segments: remaining,
          players: updatedPlayers,
        },
        sequence: current.sequence,
      };
    }
    case "ASSIGN_SEGMENT_TO_PLAYER": {
      const { playerId, segmentId } = action.payload;
      const existing = current.state.players[playerId];
      if (!existing) return current;
      const currentSegments = new Set(existing.segments ?? []);
      currentSegments.add(segmentId);
      return {
        state: {
          ...current.state,
          players: {
            ...current.state.players,
            [playerId]: {
              ...existing,
              segments: Array.from(currentSegments),
            },
          },
        },
        sequence: current.sequence,
      };
    }
    case "REMOVE_SEGMENT_FROM_PLAYER": {
      const { playerId, segmentId } = action.payload;
      const existing = current.state.players[playerId];
      if (!existing) return current;
      return {
        state: {
          ...current.state,
          players: {
            ...current.state.players,
            [playerId]: {
              ...existing,
              segments: (existing.segments ?? []).filter((s) => s !== segmentId),
            },
          },
        },
        sequence: current.sequence,
      };
    }
    case "RESET": {
      const base = createInitialState();
      const fraudRules = createDefaultFraudRules();
      const amlRules = createDefaultAmlRules();
      const rgRules = createDefaultRGRules();
      return {
        state: {
          ...base,
          rules: [...(base.rules ?? []), ...fraudRules, ...amlRules, ...rgRules],
        },
        sequence: 0,
      };
    }
    default:
      return current;
  }
}

const RiskEngineContext = createContext<RiskEngineContextValue | undefined>(
  undefined,
);

export function RiskEngineProvider({ children }: { children: ReactNode }) {
  const [internal, dispatch] = useReducer(reducer, undefined, () => {
    const base = createInitialState();
    const fraudRules = createDefaultFraudRules();
    const amlRules = createDefaultAmlRules();
    const rgRules = createDefaultRGRules();
    return {
      state: {
        ...base,
        rules: [...(base.rules ?? []), ...fraudRules, ...amlRules, ...rgRules],
      },
      sequence: 0,
    };
  });

  const value: RiskEngineContextValue = useMemo(
    () => ({
      state: internal.state,
      sequence: internal.sequence,
      processSimulatorEvent: (input: SimulatorEventInput) => {
        const nextSeq = internal.sequence + 1;
        const engineEvent = buildEngineEventFromSimulator(nextSeq, input);
        const result = processEvent(internal.state, engineEvent);

        // After processing the event, apply dynamic segment evaluation
        // without modifying the core risk engine logic.
        const updatedState = { ...result.state };
        const playerId = input.playerId;
        const player = updatedState.players[playerId];

        if (player) {
          const segments = updatedState.segments ?? [];
          const baseSegments = new Set(player.segments ?? []);

          for (const seg of segments) {
            const include =
              (seg.includePlayers ?? []).includes(playerId);
            const exclude =
              (seg.excludePlayers ?? []).includes(playerId);

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

          updatedState.players = {
            ...updatedState.players,
            [playerId]: {
              ...player,
              segments: Array.from(baseSegments),
            },
          };
        }

        dispatch({
          type: "COMMIT",
          payload: { state: updatedState, sequence: nextSeq },
        });
        return { ...result, state: updatedState };
      },
      updatePlayerStatus: (playerId: string, patch: Partial<PlayerRiskState>) =>
        dispatch({ type: "UPDATE_PLAYER", payload: { playerId, patch } }),
      addRule: (rule: Rule) => dispatch({ type: "ADD_RULE", payload: rule }),
      toggleRule: (id: string) =>
        dispatch({ type: "TOGGLE_RULE", payload: { id } }),
      updateRule: (id: string, updates: Partial<Rule>) =>
        dispatch({ type: "UPDATE_RULE", payload: { id, updates } }),
      removeRule: (id: string) =>
        dispatch({ type: "REMOVE_RULE", payload: { id } }),
      createSegment: (segment: Segment) =>
        dispatch({ type: "CREATE_SEGMENT", payload: segment }),
      updateSegment: (id: string, updates: Partial<Segment>) =>
        dispatch({ type: "UPDATE_SEGMENT", payload: { id, updates } }),
      deleteSegment: (id: string) =>
        dispatch({ type: "DELETE_SEGMENT", payload: { id } }),
      assignSegmentToPlayer: (playerId: string, segmentId: string) =>
        dispatch({
          type: "ASSIGN_SEGMENT_TO_PLAYER",
          payload: { playerId, segmentId },
        }),
      removeSegmentFromPlayer: (playerId: string, segmentId: string) =>
        dispatch({
          type: "REMOVE_SEGMENT_FROM_PLAYER",
          payload: { playerId, segmentId },
        }),
      updateHighRiskBet: (betId, patch) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              highRiskBets: internal.state.highRiskBets.map((b) =>
                b.id === betId
                  ? {
                      ...b,
                      ...patch,
                      possiblePayout:
                        patch.stake != null || patch.odds != null
                          ? (patch.stake ?? b.stake) * (patch.odds ?? b.odds)
                          : b.possiblePayout,
                    }
                  : b,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      addHighRiskBet: (bet: HighRiskBet) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              highRiskBets: [...internal.state.highRiskBets, bet],
            },
            sequence: internal.sequence,
          },
        }),
      approveHighRiskBet: (id: string) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              highRiskBets: internal.state.highRiskBets.map((b) =>
                b.id === id ? { ...b, status: "approved" } : b,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      rejectHighRiskBet: (id: string) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              highRiskBets: internal.state.highRiskBets.map((b) =>
                b.id === id ? { ...b, status: "rejected" } : b,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      modifyHighRiskBet: (id: string, updates: { stake?: number; odds?: number }) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              highRiskBets: internal.state.highRiskBets.map((b) =>
                b.id === id
                  ? {
                      ...b,
                      ...updates,
                      possiblePayout:
                        updates.stake != null || updates.odds != null
                          ? (updates.stake ?? b.stake) * (updates.odds ?? b.odds)
                          : b.possiblePayout,
                      status: "modified",
                    }
                  : b,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      resolveAlert: (alertId: string) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              alerts: internal.state.alerts.map((a) =>
                a.id === alertId ? { ...a, status: "resolved" } : a,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      closeCase: (caseId: string) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              cases: internal.state.cases.map((c) =>
                c.id === caseId ? { ...c, status: "Closed" } : c,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      logAudit: (entry: AuditEntry) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              auditLog: [...(internal.state.auditLog ?? []), entry],
            },
            sequence: internal.sequence,
          },
        }),
      assignAlert: (alertId: string, analyst: string | null) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              alerts: internal.state.alerts.map((a) =>
                a.id === alertId ? { ...a, assignedTo: analyst } : a,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      updateAlertStatus: (alertId, status, resolutionNote) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: {
              ...internal.state,
              alerts: internal.state.alerts.map((a) =>
                a.id === alertId
                  ? {
                      ...a,
                      status,
                      ...(resolutionNote !== undefined
                        ? { resolutionNote }
                        : {}),
                    }
                  : a,
              ),
            },
            sequence: internal.sequence,
          },
        }),
      escalateAlertToCase: (alertId: string, title?: string) =>
        dispatch({
          type: "COMMIT",
          payload: {
            state: (() => {
              const alert = internal.state.alerts.find((a) => a.id === alertId);
              if (!alert) return internal.state;
              const caseId = `CASE-MANUAL-${Date.now()}`;
              const newCase = {
                id: caseId,
                playerId: alert.playerId,
                alerts: [alert.id],
                openedAt: new Date().toISOString(),
                status: "Open" as const,
              };
              return {
                ...internal.state,
                alerts: internal.state.alerts.map((a) =>
                  a.id === alertId ? { ...a, status: "escalated" } : a,
                ),
                cases: [...internal.state.cases, newCase],
              };
            })(),
            sequence: internal.sequence,
          },
        }),
      reset: () => dispatch({ type: "RESET" }),
    }),
    [internal],
  );

  return (
    <RiskEngineContext.Provider value={value}>
      {children}
    </RiskEngineContext.Provider>
  );
}

export function useRiskEngine() {
  const ctx = useContext(RiskEngineContext);
  if (!ctx) {
    throw new Error("useRiskEngine must be used within a RiskEngineProvider");
  }

  const dashboard = getDashboardStats(ctx.state);

  return {
    ...ctx,
    dashboard,
  };
}

