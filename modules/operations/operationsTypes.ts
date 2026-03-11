import type { RiskEngineState, PlayerRiskState } from "../risk-engine";

export type BulkIdentifier = string;

export interface BulkAccountClosureRequest {
  identifiers: BulkIdentifier[];
  reasonForClosure: string;
  overrideClosedAccounts: boolean;
  comments?: string;
  agent: string;
}

export interface BulkAccountClosureSummary {
  totalUploaded: number;
  validAccounts: number;
  failedAccounts: number;
  closedAccountIds: string[];
}

export interface BulkAccountClosureHistoryEntry {
  updatedTime: string;
  accountsClosed: string[];
  reason: string;
  comments?: string;
  agent: string;
}

export interface BulkCategoryChangeRequest {
  identifiers: BulkIdentifier[];
  partner?: string;
  newCategory?: string;
  changeToPreviousCategory?: boolean;
  reasonForClose?: string;
  comments?: string;
  agent: string;
}

export interface BulkCategoryChangeSummary {
  uploaded: number;
  success: number;
  failed: number;
  appliedCategory?: string;
}

export interface BulkCategoryChangeHistoryEntry {
  updatedTime: string;
  accounts: string[];
  partner?: string;
  newCategory?: string;
  changeToPreviousCategory?: boolean;
  reasonForClose?: string;
  comments?: string;
  agent: string;
}

export type BlockActionType = "deposit" | "withdrawal" | "bonus" | "gameplay";

export interface BulkBlockActionsRequest {
  identifiers: BulkIdentifier[];
  actions: BlockActionType[];
  agent: string;
  comments?: string;
}

export interface BulkBlockActionsSummary {
  accountsProcessed: number;
  accountsFailed: number;
  actionsApplied: BlockActionType[];
}

export interface BulkBlockActionsHistoryEntry {
  updatedTime: string;
  accounts: string[];
  actionsApplied: BlockActionType[];
  comments?: string;
  agent: string;
}

export interface BulkTestUserMarketingRequest {
  identifiers: BulkIdentifier[];
  markTestUser?: boolean;
  removeMarketingSubscription?: boolean;
  agent: string;
  comments?: string;
}

export interface BulkTestUserMarketingSummary {
  accountsProcessed: number;
  accountsFailed: number;
}

export interface BulkTestUserMarketingHistoryEntry {
  updatedTime: string;
  accounts: string[];
  markTestUser?: boolean;
  removeMarketingSubscription?: boolean;
  comments?: string;
  agent: string;
}

export interface BulkAffiliateIdentifierRequest {
  identifiers: BulkIdentifier[];
  agent: string;
  comments?: string;
}

export interface BulkAffiliateIdentifierSummary {
  totalUploaded: number;
  validAccounts: number;
  invalidAccounts: number;
}

export interface BulkAffiliateIdentifierHistoryEntry {
  updatedTime: string;
  accounts: string[];
  comments?: string;
  agent: string;
}

export interface BulkAffiliateNameRequest {
  identifiers: BulkIdentifier[];
  agent: string;
  comments?: string;
}

export interface BulkAffiliateNameSummary {
  uploaded: number;
  success: number;
  failed: number;
}

export interface BulkAffiliateNameHistoryEntry {
  updatedTime: string;
  accounts: string[];
  comments?: string;
  agent: string;
}

export interface BulkMoveCddTierRequest {
  identifiers: BulkIdentifier[];
  newTier: string;
  comments?: string;
  agent: string;
}

export interface BulkMoveCddTierSummary {
  accountsMoved: number;
  accountsFailed: number;
}

export interface BulkMoveCddTierHistoryEntry {
  updatedTime: string;
  accounts: string[];
  newTier: string;
  comments?: string;
  agent: string;
}

export interface BulkOperationStateExtensions {
  bulkAccountClosureHistory?: BulkAccountClosureHistoryEntry[];
  bulkCategoryChangeHistory?: BulkCategoryChangeHistoryEntry[];
  bulkBlockActionsHistory?: BulkBlockActionsHistoryEntry[];
  bulkTestUserMarketingHistory?: BulkTestUserMarketingHistoryEntry[];
  bulkAffiliateIdentifierHistory?: BulkAffiliateIdentifierHistoryEntry[];
  bulkAffiliateNameHistory?: BulkAffiliateNameHistoryEntry[];
  bulkMoveCddTierHistory?: BulkMoveCddTierHistoryEntry[];
}

export type MutableRiskEngineState = RiskEngineState & BulkOperationStateExtensions;

export type PlayerLookup = (state: RiskEngineState, id: BulkIdentifier) => PlayerRiskState | undefined;

