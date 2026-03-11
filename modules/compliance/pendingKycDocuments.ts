import type { RiskEngineState } from "../risk-engine";

export interface PendingKycDateRange {
  from: string;
  to: string;
}

export interface PendingKycFilters {
  dateRange?: PendingKycDateRange;
  partner?: string;
  jurisdiction?: string;
  verificationType?: string;
  country?: string;
}

export interface PendingKycRow {
  jurisdiction?: string;
  partner?: string;
  masterId?: string;
  ECR_ID: string;
  uploadTime: string;
  verificationType?: string;
  documentType?: string;
  country: string;
  kycLevel: string;
}

function inDateRange(dateIso: string, range?: PendingKycDateRange): boolean {
  if (!range) return true;
  const ts = new Date(dateIso).getTime();
  if (Number.isNaN(ts)) return true;
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  if (!Number.isNaN(from) && ts < from) return false;
  if (!Number.isNaN(to) && ts > to) return false;
  return true;
}

/**
 * Returns pending KYC documents based on player KYC status.
 * The simulator uses \"Pending\" as the closest equivalent to \"verif_init\".
 */
export function getPendingKycDocuments(
  state: RiskEngineState,
  filters?: PendingKycFilters,
): PendingKycRow[] {
  const rows: PendingKycRow[] = [];

  for (const player of Object.values(state.players)) {
    // Map operational status \"verif_init\" to simulator status \"Pending\".
    if (player.kycStatus !== "Pending") continue;

    if (!inDateRange(player.lastActivity, filters?.dateRange)) {
      continue;
    }

    if (filters?.country && player.country !== filters.country) {
      continue;
    }

    rows.push({
      jurisdiction: filters?.jurisdiction,
      partner: filters?.partner,
      masterId: undefined,
      ECR_ID: player.playerId,
      uploadTime: player.lastActivity,
      verificationType: filters?.verificationType,
      documentType: undefined,
      country: player.country,
      kycLevel: player.kycLevel,
    });
  }

  return rows;
}

export function pendingKycDocumentsToCsv(rows: PendingKycRow[]): string {
  const header = [
    "jurisdiction",
    "partner",
    "masterId",
    "ECR_ID",
    "uploadTime",
    "verificationType",
    "documentType",
    "country",
    "kycLevel",
  ];

  const lines = rows.map((r) =>
    [
      r.jurisdiction ?? "",
      r.partner ?? "",
      r.masterId ?? "",
      r.ECR_ID,
      r.uploadTime,
      r.verificationType ?? "",
      r.documentType ?? "",
      r.country,
      r.kycLevel,
    ].join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

