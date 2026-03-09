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
  | { type: "PROCESS_EVENT"; payload: SimulatorEventInput }
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
    case "PROCESS_EVENT": {
      const seq = current.sequence + 1;
      const engineEvent = buildEngineEventFromSimulator(seq, action.payload);
      const result = processEvent(current.state, engineEvent);
      return {
        state: result.state,
        sequence: seq,
      };
    }
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
        dispatch({ type: "PROCESS_EVENT", payload: input });
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

