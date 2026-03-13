"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

type CaseNote = {
  id: string;
  createdAt: string;
  author: string;
  text: string;
};

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string;

  const {
    state,
    closeCase,
    updatePlayerStatus,
    assignSegmentToPlayer,
    escalateAlertToCase,
  } = useRiskEngine();

  const [notes, setNotes] = useState<Record<string, CaseNote[]>>({});
  const [newNote, setNewNote] = useState<string>("");

  const caseRecord = useMemo(
    () => state.cases.find((c) => c.id === caseId) ?? null,
    [state.cases, caseId],
  );

  const player = caseRecord ? state.players[caseRecord.playerId] : undefined;

  const linkedAlerts = useMemo(() => {
    if (!caseRecord) return [];
    return state.alerts.filter((a) => caseRecord.alerts.includes(a.id));
  }, [state.alerts, caseRecord]);

  const caseNotes = notes[caseId] ?? [];

  const timelineItems = useMemo(() => {
    if (!caseRecord) return [];

    const items: { timestamp: string; label: string }[] = [];

    items.push({
      timestamp: caseRecord.openedAt,
      label: "Case created",
    });

    for (const alert of linkedAlerts) {
      items.push({
        timestamp: alert.createdAt ?? alert.timestamp,
        label: `Alert ${alert.id} (${alert.severity}) created from rule ${alert.ruleTriggered}`,
      });
    }

    const relatedEvents = state.events.filter(
      (e) =>
        e.playerId === caseRecord.playerId &&
        e.triggeredRules.some((r) => caseRecord.alerts.includes(r)),
    );

    for (const ev of relatedEvents) {
      items.push({
        timestamp: ev.timestamp,
        label: `Event ${ev.id} (${ev.eventType}) processed`,
      });
    }

    return items.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [caseRecord, linkedAlerts, state.events]);

  if (!caseRecord) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-50">Case not found</h1>
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Back to Cases
          </button>
        </div>
        <p className="text-xs text-slate-400">
          The requested case could not be found. It may have been closed or removed.
        </p>
      </div>
    );
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    const note: CaseNote = {
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      author: "Risk Analyst",
      text: newNote.trim(),
    };
    setNotes((prev) => ({
      ...prev,
      [caseId]: [...(prev[caseId] ?? []), note],
    }));
    setNewNote("");
  }

  function handleFreezeAccount() {
    if (!player) return;
    updatePlayerStatus(player.playerId, {
      accountStatus: "Frozen",
      canDeposit: false,
      canWithdraw: false,
      isFrozen: true,
    });
  }

  function handleRequestKyc() {
    if (!player) return;
    updatePlayerStatus(player.playerId, {
      kycStatus: "Pending",
    });
  }

  function handleAssignSegment(segmentId: string) {
    if (!player) return;
    if (segmentId && segmentId !== "none") {
      assignSegmentToPlayer(player.playerId, segmentId);
    }
  }

  function handleEscalate() {
    if (linkedAlerts.length > 0) {
      // Escalate the first linked alert to ensure integration with existing handler
      escalateAlertToCase(linkedAlerts[0].id, `Escalated from case ${caseRecord.id}`);
    }
  }

  function handleCloseCase() {
    closeCase(caseRecord.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Case {caseRecord.id}
          </h1>
          <p className="text-xs text-slate-400">
            Full investigation workspace with alerts, events, notes, and actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/cases")}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          Back to Cases
        </button>
      </div>

      {/* Case summary */}
      <Card title="Case Summary">
        <div className="grid gap-3 text-xs md:grid-cols-3">
          <div className="space-y-1">
            <div className="text-slate-400">Case ID</div>
            <div className="font-mono text-[11px] text-slate-200">
              {caseRecord.id}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">Player</div>
            <div className="text-slate-200">
              {player ? `${player.name} (${player.playerId})` : caseRecord.playerId}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">Status</div>
            <Badge
              variant={
                caseRecord.status === "Closed"
                  ? "success"
                  : caseRecord.status === "Open"
                    ? "warning"
                    : "outline"
              }
            >
              {caseRecord.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">Priority</div>
            <div className="text-slate-300">Medium</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">Assigned Analyst</div>
            <div className="text-slate-300">Unassigned</div>
          </div>
          <div className="space-y-1">
            <div className="text-slate-400">Created</div>
            <div className="font-mono text-[11px] text-slate-300">
              {new Date(caseRecord.openedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-[2fr_1.2fr]">
        {/* Left column: alerts + timeline */}
        <div className="space-y-4">
          <Card title="Linked Alerts">
            {linkedAlerts.length === 0 ? (
              <p className="text-xs text-slate-400">
                No alerts are linked to this case.
              </p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Alert ID</TH>
                    <TH>Rule</TH>
                    <TH>Severity</TH>
                    <TH>Status</TH>
                    <TH>Created</TH>
                  </TR>
                </THead>
                <TBody>
                  {linkedAlerts.map((a) => (
                    <TR key={a.id} className="hover:bg-slate-900/60">
                      <TD className="font-mono text-[11px] text-slate-300">
                        {a.id}
                      </TD>
                      <TD className="text-xs text-slate-200">
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
                      <TD className="text-[11px] text-slate-200">{a.status}</TD>
                      <TD className="font-mono text-[11px] text-slate-400">
                        {new Date(a.createdAt ?? a.timestamp).toLocaleString()}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <Card title="Event Timeline">
            {timelineItems.length === 0 ? (
              <p className="text-xs text-slate-400">
                No events associated with this case yet.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {timelineItems.map((item, idx) => (
                  <div
                    key={`${item.timestamp}-${idx}`}
                    className="flex items-start gap-2"
                  >
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="text-slate-200">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: notes + actions */}
        <div className="space-y-4">
          <Card title="Analyst Notes">
            <div className="space-y-2 text-xs">
              <textarea
                className="h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
                placeholder="Add investigation notes, hypotheses, or next steps..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="rounded-md border border-emerald-600 bg-emerald-600/10 px-3 py-1 text-[11px] text-emerald-100 hover:bg-emerald-600/20"
                >
                  Add Note
                </button>
              </div>
              {caseNotes.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Previous Notes
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950/60 p-2">
                    {caseNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-md border border-slate-800 bg-slate-900/80 p-2"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{note.author}</span>
                          <span className="font-mono">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-100">
                          {note.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Case Actions">
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={handleFreezeAccount}
                className="flex w-full items-center justify-between rounded-md border border-red-600 bg-red-600/10 px-3 py-1 text-[11px] text-red-100 hover:bg-red-600/20"
              >
                <span>Freeze Account</span>
                <span className="font-mono text-[10px]">account_status = Frozen</span>
              </button>
              <button
                type="button"
                onClick={handleRequestKyc}
                className="flex w-full items-center justify-between rounded-md border border-amber-600 bg-amber-600/10 px-3 py-1 text-[11px] text-amber-100 hover:bg-amber-600/20"
              >
                <span>Request KYC</span>
                <span className="font-mono text-[10px]">kyc_status = Pending</span>
              </button>
              <div className="space-y-1 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                <div className="mb-1 text-[11px] font-semibold text-slate-200">
                  Assign Segment
                </div>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-500"
                  defaultValue="none"
                  onChange={(e) => handleAssignSegment(e.target.value)}
                >
                  <option value="none">Select segment</option>
                  <option value="high_risk">high_risk</option>
                  <option value="critical_risk">critical_risk</option>
                  <option value="vip">vip</option>
                  <option value="self_excluded">self_excluded</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleEscalate}
                className="flex w-full items-center justify-between rounded-md border border-sky-600 bg-sky-600/10 px-3 py-1 text-[11px] text-sky-100 hover:bg-sky-600/20"
              >
                <span>Escalate</span>
                <span className="font-mono text-[10px]">link / create follow-up</span>
              </button>
              <button
                type="button"
                onClick={handleCloseCase}
                className="flex w-full items-center justify-between rounded-md border border-emerald-600 bg-emerald-600/10 px-3 py-1 text-[11px] text-emerald-100 hover:bg-emerald-600/20"
              >
                <span>Close Case</span>
                <span className="font-mono text-[10px]">status = Closed</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

