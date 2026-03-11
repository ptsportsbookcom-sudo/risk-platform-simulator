 "use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { SEGMENT_ID_TO_NAME } from "@/modules/segmentation/segmentRegistry";

type BulkActionId =
  | "freeze"
  | "unfreeze"
  | "block_withdrawals"
  | "unblock_withdrawals"
  | "block_deposits"
  | "unblock_deposits"
  | "assign_segment"
  | "rg_monitoring";

export default function BulkActionsPage() {
  const { state, updatePlayerStatus, assignSegmentToPlayer, logAudit } =
    useRiskEngine();
  const players = Object.values(state.players);
  const segments = state.segments ?? [];

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkAction, setBulkAction] = useState<BulkActionId | "">("");
  const [segmentId, setSegmentId] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const anySelected = useMemo(
    () => Object.values(selectedIds).some(Boolean),
    [selectedIds],
  );

  const toggleAll = () => {
    if (!anySelected) {
      const all: Record<string, boolean> = {};
      for (const p of players) {
        all[p.playerId] = true;
      }
      setSelectedIds(all);
    } else {
      setSelectedIds({});
    }
  };

  const toggleOne = (playerId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  function handleExecuteClick() {
    if (!bulkAction || !anySelected) return;
    setShowConfirm(true);
  }

  function applyAction() {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id]);
    const now = new Date().toISOString();

    for (const playerId of ids) {
      switch (bulkAction) {
        case "freeze":
          updatePlayerStatus(playerId, {
            accountStatus: "Frozen",
            canDeposit: false,
            canWithdraw: false,
          });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_freeze_account",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "unfreeze":
          updatePlayerStatus(playerId, {
            accountStatus: "Active",
            canDeposit: true,
            canWithdraw: true,
          });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_unfreeze_account",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "block_withdrawals":
          updatePlayerStatus(playerId, { canWithdraw: false });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_block_withdrawals",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "unblock_withdrawals":
          updatePlayerStatus(playerId, { canWithdraw: true });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_unblock_withdrawals",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "block_deposits":
          updatePlayerStatus(playerId, { canDeposit: false });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_block_deposits",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "unblock_deposits":
          updatePlayerStatus(playerId, { canDeposit: true });
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_unblock_deposits",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        case "assign_segment":
          if (segmentId) {
            assignSegmentToPlayer(playerId, segmentId);
            logAudit({
              id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              playerId,
              action: `bulk_assign_segment_${segmentId}`,
              performedBy: "risk_analyst",
              timestamp: now,
            });
          }
          break;
        case "rg_monitoring":
          updatePlayerStatus(playerId, { rgMonitoring: true } as any);
          logAudit({
            id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            playerId,
            action: "bulk_enable_rg_monitoring",
            performedBy: "risk_analyst",
            timestamp: now,
          });
          break;
        default:
          break;
      }
    }

    setShowConfirm(false);
    setSelectedIds({});
    setResultMessage(`Action applied to ${ids.length} players`);
    setTimeout(() => setResultMessage(null), 4000);
  }

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Bulk Actions</h1>
          <p className="text-xs text-slate-400">
            Select multiple players and apply operational controls in one step.
          </p>
        </div>
        <Badge variant="outline">{selectedCount} selected</Badge>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span>Bulk Action</span>
            <select
              value={bulkAction}
              onChange={(e) =>
                setBulkAction(e.target.value as BulkActionId | "")
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="">Select action</option>
              <option value="freeze">Freeze Accounts</option>
              <option value="unfreeze">Unfreeze Accounts</option>
              <option value="block_withdrawals">Block Withdrawals</option>
              <option value="unblock_withdrawals">Unblock Withdrawals</option>
              <option value="block_deposits">Block Deposits</option>
              <option value="unblock_deposits">Unblock Deposits</option>
              <option value="assign_segment">Assign Segment</option>
              <option value="rg_monitoring">Enable RG Monitoring</option>
            </select>
          </div>
          {bulkAction === "assign_segment" && (
            <div className="flex items-center gap-2">
              <span>Segment</span>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              >
                <option value="">Select segment</option>
                {segments.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={handleExecuteClick}
            disabled={
              !bulkAction ||
              !anySelected ||
              (bulkAction === "assign_segment" && !segmentId)
            }
            className={`rounded-md border px-3 py-1 text-[11px] ${
              !bulkAction ||
              !anySelected ||
              (bulkAction === "assign_segment" && !segmentId)
                ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500"
                : "border-emerald-600 bg-emerald-600/10 text-emerald-100 hover:bg-emerald-600/20"
            }`}
          >
            Execute Action
          </button>
          {resultMessage && (
            <span className="text-[11px] text-emerald-300">{resultMessage}</span>
          )}
        </div>

        <Table>
          <THead>
            <TR>
              <TH>
                <input
                  type="checkbox"
                  checked={anySelected}
                  onChange={toggleAll}
                />
              </TH>
              <TH>Player ID</TH>
              <TH>Name</TH>
              <TH>Segments</TH>
              <TH>KYC Status</TH>
              <TH>CDD Tier</TH>
              <TH>Account Status</TH>
            </TR>
          </THead>
          <TBody>
            {players.map((p) => (
              <TR key={p.playerId}>
                <TD>
                  <input
                    type="checkbox"
                    checked={!!selectedIds[p.playerId]}
                    onChange={() => toggleOne(p.playerId)}
                  />
                </TD>
                <TD className="font-mono text-[11px] text-slate-300">
                  {p.playerId}
                </TD>
                <TD className="text-xs text-slate-100">{p.name}</TD>
                <TD className="text-xs text-slate-200">
                  <div className="flex flex-wrap gap-1">
                    {(p.segments ?? []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline">
                        {SEGMENT_ID_TO_NAME[s] ?? s}
                      </Badge>
                    ))}
                    {(p.segments?.length ?? 0) > 3 && (
                      <span className="text-[10px] text-slate-500">
                        +{(p.segments?.length ?? 0) - 3} more
                      </span>
                    )}
                  </div>
                </TD>
                <TD className="text-xs text-slate-200">{p.kycStatus}</TD>
                <TD className="text-xs text-slate-200">{p.cddTier}</TD>
                <TD className="text-xs text-slate-200">{p.accountStatus}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {showConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-black/60">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">
                Confirm bulk action
              </h2>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-200">
              You are about to modify {selectedCount} players.
            </p>
            <div className="flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyAction}
                className="rounded-md border border-emerald-500/70 bg-emerald-500/20 px-3 py-1 font-medium text-emerald-100 hover:bg-emerald-500/30"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

