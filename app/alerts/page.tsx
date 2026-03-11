 "use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

const STATUSES = [
  "open",
  "investigating",
  "resolved",
  "dismissed",
  "escalated",
] as const;

const ANALYSTS = ["Risk Analyst 1", "Risk Analyst 2"] as const;

export default function AlertsPage() {
  const { state, assignAlert, updateAlertStatus, escalateAlertToCase } =
    useRiskEngine();
  const alerts = state.alerts;

  const [statusFilter, setStatusFilter] = useState<"all" | (typeof STATUSES)[number]>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "Critical" | "High" | "Medium" | "Low">("all");
  const [assignedFilter, setAssignedFilter] = useState<"all" | (typeof ANALYSTS)[number]>("all");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (
        assignedFilter !== "all" &&
        (a.assignedTo ?? null) !== assignedFilter
      ) {
        return false;
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, assignedFilter]);

  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId],
  );

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
                setAssignedFilter(e.target.value as typeof assignedFilter)
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="all">All</option>
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
                      {a.ruleTriggered}
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
                      <Badge
                        variant={
                          a.status === "resolved" || a.status === "dismissed"
                            ? "success"
                            : a.status === "open"
                              ? "warning"
                              : a.status === "investigating"
                                ? "outline"
                                : "danger"
                        }
                      >
                        {a.status}
                      </Badge>
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
                          onChange={(e) =>
                            assignAlert(
                              a.id,
                              e.target.value as (typeof ANALYSTS)[number],
                            )
                          }
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
                                updateAlertStatus(a.id, "resolved");
                              }}
                              className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(a.id, "dismissed");
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

        <Card
          title="Alert Details"
          description="Context for the selected alert."
        >
          {!selectedAlert ? (
            <p className="text-xs text-slate-400">
              Select an alert from the table to view details.
            </p>
          ) : (
            <div className="space-y-2 text-xs text-slate-200">
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
                <span>{selectedAlert.ruleTriggered}</span>
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
                    selectedAlert.status === "resolved" ||
                    selectedAlert.status === "dismissed"
                      ? "success"
                      : selectedAlert.status === "open"
                        ? "warning"
                        : selectedAlert.status === "investigating"
                          ? "outline"
                          : "danger"
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

              <div className="pt-2">
                <span className="text-[11px] text-slate-400">Event details</span>
                <div className="mt-1 rounded-md border border-slate-800 bg-slate-950/60 p-2 text-[11px] text-slate-200">
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
                        <p className="text-slate-500">
                          No related event found in recent log.
                        </p>
                      );
                    }
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Event ID</span>
                          <span className="font-mono text-[11px] text-slate-300">
                            {relatedEvent.id}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Type</span>
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
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Actions can also be performed directly from the table.
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

