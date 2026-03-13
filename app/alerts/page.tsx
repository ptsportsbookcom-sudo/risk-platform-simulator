 "use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

function formatActionType(type: string) {
  const map: Record<string, string> = {
    createAlert: "Create Alert",
    createCase: "Create Case",
    blockBet: "Block Bet",
    blockDeposit: "Block Deposit",
    blockWithdrawal: "Block Withdrawal",
    freezeAccount: "Freeze Account",
    requireKyc: "Require KYC",
    assignSegment: "Assign Segment",
  };
  return map[type] ?? type;
}

function safeValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  return String(value);
}

const STATUSES = [
  "open",
  "investigating",
  "confirmed_fraud",
  "false_positive",
  "closed",
] as const;

const ANALYSTS = ["Risk Analyst 1", "Risk Analyst 2"] as const;

export default function AlertsPage() {
  const { state, assignAlert, updateAlertStatus, escalateAlertToCase } =
    useRiskEngine();
  const alerts = state.alerts;

  const [resolutionNoteDraft, setResolutionNoteDraft] = useState<string>("");

  const [statusFilter, setStatusFilter] = useState<"all" | (typeof STATUSES)[number]>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "Critical" | "High" | "Medium" | "Low">("all");
  const [assignedFilter, setAssignedFilter] = useState<
    "all" | "unassigned" | (typeof ANALYSTS)[number]
  >("all");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (assignedFilter !== "all") {
        if (assignedFilter === "unassigned") {
          if (a.assignedTo != null) return false;
        } else if ((a.assignedTo ?? null) !== assignedFilter) {
          return false;
        }
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, assignedFilter]);

  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId],
  );

  // Keep local resolution note draft in sync with selected alert
  if (selectedAlert && resolutionNoteDraft === "" && selectedAlert.resolutionNote) {
    // Initialize lazily to avoid useEffect for simplicity
    // eslint-disable-next-line no-console
    setResolutionNoteDraft(selectedAlert.resolutionNote);
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Alerts</h1>
          <p className="text-xs text-slate-400">
            Triggered rules awaiting triage or investigation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Severity</span>
            <select
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as typeof severityFilter)
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="all">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>Assigned</span>
            <select
              value={assignedFilter}
              onChange={(e) =>
                setAssignedFilter(
                  e.target.value as "all" | "unassigned" | (typeof ANALYSTS)[number],
                )
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              {ANALYSTS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline">
            {filteredAlerts.length} matching alerts
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1.2fr]">
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Alert ID</TH>
                <TH>Player</TH>
                <TH>Rule</TH>
                <TH>Severity</TH>
                <TH>Status</TH>
                <TH>Assigned To</TH>
                <TH>Created At</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filteredAlerts.map((a) => {
                const player = state.players[a.playerId];
                return (
                  <TR
                    key={a.id}
                    className="cursor-pointer hover:bg-slate-900/60"
                    onClick={() => setSelectedAlertId(a.id)}
                  >
                    <TD className="font-mono text-[11px] text-slate-300">
                      {a.id}
                    </TD>
                    <TD className="text-xs text-slate-200">
                      {player ? `${player.name} (${a.playerId})` : a.playerId}
                    </TD>
                    <TD className="text-xs text-slate-100">
                      {state.rules.find((r) => r.id === a.ruleTriggered)?.name ??
                        a.ruleTriggered}
                    </TD>
                    <TD>
                      <Badge
                        variant={
                          a.severity === "Critical"
                            ? "danger"
                            : a.severity === "High"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {a.severity}
                      </Badge>
                    </TD>
                    <TD>
                      <select
                        value={a.status}
                        onChange={(e) => {
                          const newStatus = e.target
                            .value as (typeof STATUSES)[number];
                          // For outcome statuses, include the current resolution note draft
                          if (
                            newStatus === "confirmed_fraud" ||
                            newStatus === "false_positive" ||
                            newStatus === "closed"
                          ) {
                            updateAlertStatus(a.id, newStatus, resolutionNoteDraft);
                          } else {
                            updateAlertStatus(a.id, newStatus);
                          }
                        }}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TD>
                    <TD className="text-[11px] text-slate-200">
                      {a.assignedTo ?? "Unassigned"}
                    </TD>
                    <TD className="font-mono text-[11px] text-slate-400">
                      {new Date(a.createdAt ?? a.timestamp).toLocaleString()}
                    </TD>
                    <TD className="text-[11px] text-slate-200">
                      <div className="flex flex-wrap gap-1">
                        <select
                          value={a.assignedTo ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            assignAlert(
                              a.id,
                              val === "" ? null : (val as (typeof ANALYSTS)[number]),
                            );
                          }}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
                        >
                          <option value="">Assign</option>
                          {ANALYSTS.map((an) => (
                            <option key={an} value={an}>
                              {an}
                            </option>
                          ))}
                        </select>
                        {a.status !== "investigating" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                                updateAlertStatus(a.id, "investigating");
                            }}
                            className="rounded-md border border-sky-600 bg-sky-600/10 px-2 py-0.5 text-sky-200 hover:bg-sky-600/20"
                          >
                            Investigate
                          </button>
                        )}
                        {a.status === "investigating" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(a.id, "confirmed_fraud");
                              }}
                              className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(a.id, "false_positive");
                              }}
                              className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-slate-200 hover:bg-slate-800"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                escalateAlertToCase(a.id);
                              }}
                              className="rounded-md border border-amber-600 bg-amber-600/10 px-2 py-0.5 text-amber-200 hover:bg-amber-600/20"
                            >
                              Escalate
                            </button>
                          </>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
              {filteredAlerts.length === 0 && (
                <TR>
                  <TD
                    colSpan={8}
                    className="px-3 py-3 text-center text-xs text-slate-400"
                  >
                    No alerts found.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </Card>

        <Card title="Alert Details" description="Context for the selected alert.">
          {!selectedAlert ? (
            <p className="text-xs text-slate-400">
              Select an alert from the table to view details.
            </p>
          ) : (
            <div className="space-y-4 text-xs text-slate-200">
              {/* Alert Summary */}
              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <h3 className="text-[11px] font-semibold text-slate-100">
                  Alert Summary
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Alert ID</span>
                  <span className="font-mono text-[11px] text-slate-100">
                    {selectedAlert.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Player</span>
                  <span>
                    {state.players[selectedAlert.playerId]?.name ??
                      selectedAlert.playerId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rule</span>
                  <span>
                    {state.rules.find(
                      (r) => r.id === selectedAlert.ruleTriggered,
                    )?.name ??
                      selectedAlert.ruleTriggered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Severity</span>
                  <Badge
                    variant={
                      selectedAlert.severity === "Critical"
                        ? "danger"
                        : selectedAlert.severity === "High"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge
                    variant={
                      selectedAlert.status === "confirmed_fraud"
                        ? "danger"
                        : selectedAlert.status === "false_positive"
                        ? "outline"
                        : selectedAlert.status === "closed"
                        ? "success"
                        : selectedAlert.status === "open"
                        ? "warning"
                        : "outline"
                    }
                  >
                    {selectedAlert.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned To</span>
                  <span>{selectedAlert.assignedTo ?? "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Created At</span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {new Date(
                      selectedAlert.createdAt ?? selectedAlert.timestamp,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Event Information */}
              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <h3 className="text-[11px] font-semibold text-slate-100">
                  Event Information
                </h3>
                {(() => {
                  const relatedEvent = state.events.find(
                    (e) =>
                      e.playerId === selectedAlert.playerId &&
                      (e.triggeredRules ?? []).includes(
                        selectedAlert.ruleTriggered,
                      ),
                  );
                  if (!relatedEvent) {
                    return (
                      <p className="text-[11px] text-slate-500">
                        No related event found in recent log.
                      </p>
                    );
                  }
                  const meta = (relatedEvent.metadata ??
                    {}) as Record<string, unknown>;
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Event ID</span>
                        <span className="font-mono text-[11px] text-slate-300">
                          {relatedEvent.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Event Type</span>
                        <span>{relatedEvent.eventType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Timestamp</span>
                        <span className="font-mono text-[11px] text-slate-300">
                          {new Date(
                            relatedEvent.timestamp,
                          ).toLocaleString()}
                        </span>
                      </div>
                      {"amount" in relatedEvent &&
                        relatedEvent.amount != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Amount</span>
                            <span>{safeValue(relatedEvent.amount)}</span>
                          </div>
                        )}
                      {meta.currency !== undefined &&
                        meta.currency !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Currency</span>
                            <span>{safeValue(meta.currency)}</span>
                          </div>
                        )}
                      {meta.product !== undefined && meta.product !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Product</span>
                          <span>{safeValue(meta.product)}</span>
                        </div>
                      )}
                      {meta.provider !== undefined && meta.provider !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Provider</span>
                          <span>{safeValue(meta.provider)}</span>
                        </div>
                      )}
                      {meta.sport !== undefined && meta.sport !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sport</span>
                          <span>{safeValue(meta.sport)}</span>
                        </div>
                      )}
                      {meta.marketType !== undefined &&
                        meta.marketType !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Market Type</span>
                            <span>{safeValue(meta.marketType)}</span>
                          </div>
                        )}
                      {meta.betType !== undefined && meta.betType !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Bet Type</span>
                          <span>{safeValue(meta.betType)}</span>
                        </div>
                      )}
                      {meta.gameType !== undefined &&
                        meta.gameType !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Game Type</span>
                            <span>{safeValue(meta.gameType)}</span>
                          </div>
                        )}
                      {meta.country !== undefined && meta.country !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Country</span>
                          <span>{safeValue(meta.country)}</span>
                        </div>
                      )}
                      {meta.device !== undefined && meta.device !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Device</span>
                          <span>{safeValue(meta.device)}</span>
                        </div>
                      )}
                      {(meta.ipAddress !== undefined && meta.ipAddress !== null) ||
                      (meta.ip !== undefined && meta.ip !== null) ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">IP</span>
                          <span>
                            {safeValue(meta.ipAddress ?? meta.ip)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              {/* Trigger Condition & Actions Executed */}
              {(() => {
                const rule = state.rules.find(
                  (r) => r.id === selectedAlert.ruleTriggered,
                );
                return (
                  <>
                    <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                      <h3 className="text-[11px] font-semibold text-slate-100">
                        Trigger Condition
                      </h3>
                      {!rule ? (
                        <p className="text-[11px] text-slate-500">
                          Rule definition not found.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-300">
                            Condition logic evaluated for this alert.
                          </div>
                          <div className="rounded-md bg-slate-900/80 p-2 font-mono text-[10px] text-slate-100">
                            {JSON.stringify(rule.conditions, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                      <h3 className="text-[11px] font-semibold text-slate-100">
                        Actions Executed
                      </h3>
                      {!rule ? (
                        <p className="text-[11px] text-slate-500">
                          Rule definition not found.
                        </p>
                      ) : (
                        <div className="space-y-1 text-[11px] text-slate-300">
                          {rule.actions && rule.actions.length > 0 ? (
                            rule.actions.map((action, idx) => (
                              <div key={`${rule.id}-action-${idx}`}>
                                {formatActionType(action.type)}{" "}
                                <span className="text-emerald-400">✔</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500">
                              No configured actions for this rule.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* System Impact */}
              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <h3 className="text-[11px] font-semibold text-slate-100">
                  System Impact
                </h3>
                {(() => {
                  const rule = state.rules.find(
                    (r) => r.id === selectedAlert.ruleTriggered,
                  );
                  const actions = rule?.actions ?? [];
                  const hasAction = (type: string) =>
                    actions.some((a) => a.type === type);
                  const betBlocked = hasAction("block_bet");
                  const segmentAssigned = hasAction("assign_segment");
                  const caseCreated =
                    hasAction("create_case") ||
                    state.cases.some((c) =>
                      (c.alerts ?? []).includes(selectedAlert.id),
                    );
                  const alertCreated = true;

                  return (
                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Bet Blocked</span>
                        <span>{betBlocked ? "YES" : "NO"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Alert Created</span>
                        <span>{alertCreated ? "YES" : "NO"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Case Created</span>
                        <span>{caseCreated ? "YES" : "NO"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Segment Assigned</span>
                        <span>{segmentAssigned ? "YES" : "NO"}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Resolution Note */}
              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <h3 className="text-[11px] font-semibold text-slate-100">
                  Resolution Note
                </h3>
                <textarea
                  className="h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="Add investigation outcome details..."
                  value={resolutionNoteDraft}
                  onChange={(e) => setResolutionNoteDraft(e.target.value)}
                />
                {selectedAlert.resolutionNote && (
                  <div className="mt-1 text-[11px] text-slate-400">
                    Last saved note:{" "}
                    <span className="text-slate-200">
                      {selectedAlert.resolutionNote}
                    </span>
                  </div>
                )}
                <p className="pt-1 text-[11px] text-slate-500">
                  Resolution note is stored when status is set to{" "}
                  <span className="font-mono">
                    confirmed_fraud, false_positive, closed
                  </span>
                  .
                </p>
              </div>

              <div className="pt-1 text-[11px] text-slate-400">
                Actions can also be performed directly from the table.
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

