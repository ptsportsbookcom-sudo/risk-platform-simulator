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
  reviewQueue?: "trading" | "casino" | "kyc";
  reviewStatus?: "pending";
  betBlocked?: boolean;
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
    reviewQueue: undefined,
    reviewStatus: undefined,
    betBlocked: false,
  };

  for (const action of actions) {
    // Record all actions
    result.recordedActions.push(action);

    switch (action.type) {
      case "create_alert":
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

      case "create_case":
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

      case "assign_segment": {
        const segmentId =
          action.params?.segmentId ??
          (action as any).value ??
          action.params?.value;
        if (!segmentId) {
          break;
        }
        const current =
          result.playerUpdates.segments ??
          state.players[playerId]?.segments ??
          [];
        const set = new Set(current);
        set.add(segmentId);
        result.playerUpdates.segments = Array.from(set);
        break;
      }

      case "assignSegment": {
        const segmentId = (action as any).value;
        if (!segmentId) break;
        const current =
          result.playerUpdates.segments ??
          state.players[playerId]?.segments ??
          [];
        const set = new Set(current);
        set.add(segmentId);
        result.playerUpdates.segments = Array.from(set);
        break;
      }

      case "blockBet": {
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          betting: true,
        };
        result.betBlocked = true;
        break;
      }

      case "blockBonus": {
        result.playerUpdates.blockedActions = {
          ...result.playerUpdates.blockedActions,
          bonus: true,
        };
        break;
      }

      case "block_bonus": {
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

      case "block_deposit": {
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

      case "block_withdrawal": {
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

      case "block_gameplay": {
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
        result.playerUpdates.canDeposit = false;
        result.playerUpdates.canWithdraw = false;
        break;
      }

      case "close_account": {
        result.playerUpdates.accountStatus = "Closed";
        result.playerUpdates.canDeposit = false;
        result.playerUpdates.canWithdraw = false;
        break;
      }

      case "sendToHighRiskReview": {
        // This action is logged but high-risk bet creation happens separately
        // in processEvent based on event type
        break;
      }

      case "sendToReviewTrading": {
        result.reviewQueue = "trading";
        result.reviewStatus = "pending";
        break;
      }

      case "sendToReviewCasino": {
        result.reviewQueue = "casino";
        result.reviewStatus = "pending";
        break;
      }

      case "sendToReviewKyc": {
        result.reviewQueue = "kyc";
        result.reviewStatus = "pending";
        break;
      }

      case "limitStake": {
        // Stake limiting is logged but enforcement happens at bet placement
        // For now, just record the action
        break;
      }

      case "changeCategory": {
        const category =
          (action as any).value ?? action.params?.category ?? "risk";
        (result.playerUpdates as any).category = category;
        break;
      }

      case "change_category": {
        const category =
          action.params?.category ?? (action as any).value ?? "risk";
        (result.playerUpdates as any).category = category;
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
