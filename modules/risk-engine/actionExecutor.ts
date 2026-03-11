import type { RuleAction } from "./ruleTypes";
import type {
  EngineAlert,
  EngineCase,
  PlayerRiskState,
  RiskEngineState,
} from "./riskEngine";
import type { AlertSeverity } from "./ruleEngine";

export interface ActionExecutionResult {
  alerts: EngineAlert[];
  cases: EngineCase[];
  playerUpdates: Partial<PlayerRiskState>;
  recordedActions: RuleAction[];
}

/**
 * Executes rule actions and returns the effects.
 * This is a lightweight executor that maps actions to system behavior.
 */
export function executeActions(
  actions: RuleAction[],
  playerId: string,
  ruleId: string,
  eventTimestamp: string,
  severity: AlertSeverity,
  state: RiskEngineState,
  nextId: (prefix: string) => string,
): ActionExecutionResult {
  const result: ActionExecutionResult = {
    alerts: [],
    cases: [],
    playerUpdates: {},
    recordedActions: [],
  };

  for (const action of actions) {
    // Record all actions
    result.recordedActions.push(action);

    switch (action.type) {
      case "createAlert": {
        const alert: EngineAlert = {
          id: nextId("ALERT"),
          playerId,
          ruleTriggered: ruleId,
          severity,
          timestamp: eventTimestamp,
          createdAt: eventTimestamp,
          status: "open",
          assignedTo: null,
        };
        result.alerts.push(alert);
        break;
      }

      case "createCase": {
        const caseRecord: EngineCase = {
          id: nextId("CASE"),
          playerId,
          alerts: result.alerts.map((a) => a.id),
          openedAt: eventTimestamp,
          status: "Open",
        };
        result.cases.push(caseRecord);
        break;
      }

      case "assignSegment": {
        // Segment assignment is handled separately in processEvent
        // This action is recorded but execution happens via SegmentationEngine
        break;
      }

      case "blockBet": {
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          betting: true,
        };
        break;
      }

      case "blockBonus": {
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          bonus: true,
        };
        break;
      }

      case "blockDeposit": {
        result.playerUpdates.canDeposit = false;
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          deposit: true,
        };
        break;
      }

      case "blockWithdrawal": {
        result.playerUpdates.canWithdraw = false;
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          withdrawal: true,
        };
        break;
      }

      case "blockGameplay": {
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          gameplay: true,
        };
        break;
      }

      case "requireKyc": {
        // Mark KYC as required by setting status to Pending if not already Approved/Failed.
        if (result.playerUpdates.kycStatus == null) {
          result.playerUpdates.kycStatus = "Pending";
        }
        break;
      }

      case "freezeAccount": {
        result.playerUpdates.accountStatus = "Frozen";
        result.playerUpdates.canDeposit = false;
        result.playerUpdates.canWithdraw = false;
        break;
      }

      case "closeAccount": {
        result.playerUpdates.accountStatus = "Closed";
        break;
      }

      case "sendToHighRiskReview": {
        // This action is logged but high-risk bet creation happens separately
        // in processEvent based on event type
        break;
      }

      case "limitStake": {
        // Stake limiting is logged but enforcement happens at bet placement
        // For now, just record the action
        break;
      }

      case "changeCategory": {
        // Category change is logged but category field doesn't exist yet
        // For now, just record the action
        break;
      }

      case "moveCddTier": {
        if (action.value) {
          result.playerUpdates.cddTier = action.value;
        }
        break;
      }

      default: {
        // Unknown action - just record it
        break;
      }
    }
  }

  return result;
}
