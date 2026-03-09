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
  createInitialState,
  processEvent,
  buildEngineEventFromSimulator,
  getDashboardStats,
} from "@/modules/risk-engine";
import type { Rule } from "@/modules/risk-engine/ruleTypes";

type RiskEngineAction =
  | { type: "COMMIT"; payload: { state: RiskEngineState; sequence: number } }
  | {
      type: "UPDATE_PLAYER";
      payload: { playerId: string; patch: Partial<PlayerRiskState> };
    }
  | { type: "ADD_RULE"; payload: Rule }
  | { type: "TOGGLE_RULE"; payload: { id: string } }
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
  reset: () => void;
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
    case "RESET":
      return { state: createInitialState(), sequence: 0 };
    default:
      return current;
  }
}

const RiskEngineContext = createContext<RiskEngineContextValue | undefined>(
  undefined,
);

export function RiskEngineProvider({ children }: { children: ReactNode }) {
  const [internal, dispatch] = useReducer(reducer, undefined, () => ({
    state: createInitialState(),
    sequence: 0,
  }));

  const value: RiskEngineContextValue = useMemo(
    () => ({
      state: internal.state,
      sequence: internal.sequence,
      processSimulatorEvent: (input: SimulatorEventInput) => {
        const nextSeq = internal.sequence + 1;
        const engineEvent = buildEngineEventFromSimulator(nextSeq, input);
        const result = processEvent(internal.state, engineEvent);
        dispatch({
          type: "COMMIT",
          payload: { state: result.state, sequence: nextSeq },
        });
        return result;
      },
      updatePlayerStatus: (playerId: string, patch: Partial<PlayerRiskState>) =>
        dispatch({ type: "UPDATE_PLAYER", payload: { playerId, patch } }),
      addRule: (rule: Rule) => dispatch({ type: "ADD_RULE", payload: rule }),
      toggleRule: (id: string) =>
        dispatch({ type: "TOGGLE_RULE", payload: { id } }),
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

