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
  createInitialState,
  processEvent,
  buildEngineEventFromSimulator,
  getDashboardStats,
} from "@/modules/risk-engine";

type RiskEngineAction =
  | { type: "COMMIT"; payload: { state: RiskEngineState; sequence: number } }
  | { type: "RESET" };

interface RiskEngineContextValue {
  state: RiskEngineState;
  sequence: number;
  processSimulatorEvent: (input: SimulatorEventInput) => ProcessEventResult;
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

