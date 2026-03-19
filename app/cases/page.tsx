 "use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function CasesPage() {
  const { state, closeCase } = useRiskEngine();
  const cases = state.cases;

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const selectedCase = selectedCaseId
    ? cases.find((c) => c.id === selectedCaseId) ?? null
    : null;

  const selectedPlayer =
    selectedCase != null ? state.players[selectedCase.playerId] : null;

  const caseAlerts =
    selectedCase != null
      ? state.alerts.filter((a) => selectedCase.alerts.includes(a.id))
      : [];

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Cases</h1>
          <p className="text-xs text-slate-400">
            Investigation cases created from alerts and rule escalations.
          </p>
        </div>
        <Badge variant="outline">
          {cases.filter((c) => c.status === "Open").length} open
        </Badge>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex-1">
          <Card>
            <Table>
              <THead>
                <TR>
                  <TH>Case ID</TH>
                  <TH>Player</TH>
                  <TH>Status</TH>
                  <TH>Alerts</TH>
                  <TH>Opened</TH>
                </TR>
              </THead>
              <TBody>
                {cases.map((c) => {
                  const player = state.players[c.playerId];
                  const isSelected = c.id === selectedCaseId;
                  return (
                    <TR
                      key={c.id}
                      className={
                        "cursor-pointer hover:bg-slate-900/60 " +
                        (isSelected ? "bg-slate-900/80" : "")
                      }
                      onClick={() =>
                        setSelectedCaseId((prev) => (prev === c.id ? null : c.id))
                      }
                    >
                      <TD className="font-mono text-[11px] text-slate-300">
                        {c.id}
                      </TD>
                      <TD className="text-xs text-slate-200">
                        {player ? `${player.name} (${c.playerId})` : c.playerId}
                      </TD>
                      <TD>
                        <Badge
                          variant={
                            c.status === "Closed"
                              ? "success"
                              : c.status === "Open"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TD>
                      <TD className="text-xs text-slate-200">
                        {c.alerts.length}
                      </TD>
                      <TD className="font-mono text-[11px] text-slate-400">
                        {new Date(c.openedAt).toLocaleString()}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        </div>

        {selectedCase && (
          <div className="w-full max-w-sm">
            <Card
              title="Case Details"
              description="Details and linked alerts for the selected case."
            >
              <div className="mb-3 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Case ID</div>
                  <div className="font-mono text-[11px] text-slate-100">
                    {selectedCase.id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Status</div>
                  <Badge
                    variant={
                      selectedCase.status === "Closed"
                        ? "success"
                        : selectedCase.status === "Open"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {selectedCase.status}
                  </Badge>
                </div>
              </div>

              <div className="mb-3 space-y-1 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Player</span>
                  <span className="text-right">
                    {selectedPlayer
                      ? `${selectedPlayer.name} (${selectedCase.playerId})`
                      : selectedCase.playerId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Opened</span>
                  <span className="font-mono text-[11px] text-slate-200">
                    {new Date(selectedCase.openedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-700"
                  onClick={() => setSelectedCaseId(null)}
                >
                  Close Panel
                </button>
                {selectedCase.status !== "Closed" && (
                  <button
                    type="button"
                    className="flex-1 rounded-md bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-emerald-50 hover:bg-emerald-500"
                    onClick={() => closeCase(selectedCase.id)}
                  >
                    Close Case
                  </button>
                )}
              </div>

              <div className="mt-2 border-t border-slate-800 pt-2">
                <div className="mb-1 text-[11px] font-semibold text-slate-200">
                  Linked Alerts
                </div>
                {caseAlerts.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    No alerts linked to this case.
                  </p>
                ) : (
                  <div className="space-y-1 text-[11px] text-slate-200">
                    {caseAlerts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1"
                      >
                        <div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {a.id}
                          </div>
                          <div className="text-xs text-slate-100">
                            {a.ruleTriggered}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">
                            {a.severity}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {a.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

