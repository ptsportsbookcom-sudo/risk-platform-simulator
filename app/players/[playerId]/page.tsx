"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { EventTimeline } from "@/components/player/EventTimeline";
import { SecuritySignals } from "@/components/player/SecuritySignals";
import { SEGMENT_ID_TO_NAME } from "@/modules/segmentation/segmentRegistry";

type ActivityTab = "casino" | "sportsbook" | "payments" | "security";

function formatEventType(type: string) {
  return type
    .split("_")
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join(" ");
}

export default function PlayerDetailPage() {
  const params = useParams<{ playerId: string }>();
  const router = useRouter();
  const playerId = decodeURIComponent(params.playerId);

  const {
    state,
    updatePlayerStatus,
    assignSegmentToPlayer,
    removeSegmentFromPlayer,
    resolveAlert,
    closeCase,
    escalateAlertToCase,
  } = useRiskEngine();
  const [activeTab, setActiveTab] = useState<ActivityTab>("casino");
  const [caseNotes, setCaseNotes] = useState<Record<string, string[]>>({});

  const player = state.players[playerId];

  const playerEvents = useMemo(
    () =>
      state.events
        .filter((e) => e.playerId === playerId)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
    [state.events, playerId],
  );

  const alertsForPlayer = state.alerts.filter((a) => a.playerId === playerId);
  const casesForPlayer = state.cases.filter((c) => c.playerId === playerId);
  const highRiskBetsForPlayer = state.highRiskBets.filter(
    (b) => b.playerId === playerId,
  );

  if (!player) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push("/players")}
          className="text-xs text-emerald-300 hover:underline"
        >
          ← Back to players
        </button>
        <Card title="Player not found">
          <p className="text-xs text-slate-300">
            No player with ID <span className="font-mono">{playerId}</span> in
            the current simulation state.
          </p>
        </Card>
      </div>
    );
  }

  function computeCasePriority(caseId: string): "Low" | "Medium" | "High" {
    const c = state.cases.find((cs) => cs.id === caseId);
    if (!c) return "Low";
    const severities = state.alerts
      .filter((a) => c.alerts.includes(a.id))
      .map((a) => a.severity);
    if (severities.includes("Critical")) return "High";
    if (severities.includes("High") || severities.includes("Sportsbook")) {
      return "Medium";
    }
    return "Low";
  }

  const casinoEvents = playerEvents.filter((e) =>
    ["casino_session", "bonus_claim"].includes(e.eventType),
  );
  const sportsbookEvents = playerEvents.filter((e) =>
    ["place_bet", "large_bet"].includes(e.eventType),
  );
  const paymentEvents = playerEvents.filter((e) =>
    ["deposit", "withdraw", "chargeback", "bonus_claim"].includes(e.eventType),
  );
  const securityEvents = playerEvents.filter((e) =>
    [
      "vpn_login",
      "multi_device_login",
      "kyc_failure",
      "cdd_threshold_breach",
    ].includes(e.eventType),
  );

  const activityByTab: Record<ActivityTab, typeof playerEvents> = {
    casino: casinoEvents,
    sportsbook: sportsbookEvents,
    payments: paymentEvents,
    security: securityEvents,
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push("/players")}
        className="text-xs text-emerald-300 hover:underline"
      >
        ← Back to players
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Player Profile"
          description={`Investigation console for player ${playerId}`}
          accent="emerald"
        >
          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Player ID</span>
              <span className="font-mono text-[11px] text-slate-100">
                {player.playerId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Name</span>
              <span>{player.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Country</span>
              <span>{player.country}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Registration</span>
              <span className="font-mono text-[11px] text-slate-300">
                {new Date(player.registrationDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400">KYC Status</span>
              <Badge
                variant={
                  player.kycStatus === "Approved"
                    ? "success"
                    : player.kycStatus === "Failed"
                      ? "danger"
                      : "outline"
                }
              >
                {player.kycStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">CDD Tier</span>
              <span>{player.cddTier}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400">Account Status</span>
              <Badge
                variant={
                  player.accountStatus === "Active"
                    ? "success"
                    : player.accountStatus === "Closed"
                      ? "danger"
                      : "warning"
                }
              >
                {player.accountStatus}
              </Badge>
            </div>
            {player.segments && player.segments.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] text-slate-400">Segments</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {player.segments.map((s) => (
                    <Badge key={s} variant="outline">
                      {SEGMENT_ID_TO_NAME[s] ?? s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Operator Actions"
          description="Apply operational controls to this account."
        >
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                updatePlayerStatus(playerId, {
                  canDeposit: false,
                  accountStatus:
                    player.accountStatus === "Active"
                      ? "Blocked"
                      : player.accountStatus,
                })
              }
              className="rounded-md border border-amber-500/60 bg-amber-500/10 px-2 py-1 text-left text-amber-100 hover:bg-amber-500/20"
            >
              Block Deposits
            </button>
            <button
              type="button"
              onClick={() =>
                updatePlayerStatus(playerId, {
                  canWithdraw: false,
                  accountStatus:
                    player.accountStatus === "Active"
                      ? "Blocked"
                      : player.accountStatus,
                })
              }
              className="rounded-md border border-amber-500/60 bg-amber-500/10 px-2 py-1 text-left text-amber-100 hover:bg-amber-500/20"
            >
              Block Withdrawals
            </button>
            <button
              type="button"
              onClick={() =>
                updatePlayerStatus(playerId, {
                  isFrozen: true,
                  canDeposit: false,
                  canWithdraw: false,
                  accountStatus: "Frozen",
                })
              }
              className="rounded-md border border-red-500/60 bg-red-500/10 px-2 py-1 text-left text-red-100 hover:bg-red-500/20"
            >
              Freeze Account
            </button>
            <button
              type="button"
              onClick={() =>
                updatePlayerStatus(playerId, {
                  cddTier: "Enhanced",
                })
              }
              className="rounded-md border border-sky-500/60 bg-sky-500/10 px-2 py-1 text-left text-sky-100 hover:bg-sky-500/20"
            >
              Escalate to CDD
            </button>
            <button
              type="button"
              onClick={() =>
                updatePlayerStatus(playerId, {
                  accountStatus: "Closed",
                  canDeposit: false,
                  canWithdraw: false,
                  isFrozen: true,
                })
              }
              className="col-span-2 rounded-md border border-red-600/70 bg-red-600/10 px-2 py-1 text-left text-red-100 hover:bg-red-600/20"
            >
              Close Account
            </button>
          </div>
        </Card>

        <Card
          title="Manage Segments"
          description="Manually assign or remove segments for this player."
        >
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-1 pb-2">
              {(player.segments ?? []).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => removeSegmentFromPlayer(playerId, s)}
                  className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100 hover:border-red-500 hover:text-red-200"
                >
                  <span>{SEGMENT_ID_TO_NAME[s] ?? s}</span>
                  <span className="text-slate-500">×</span>
                </button>
              ))}
              {(player.segments?.length ?? 0) === 0 && (
                <span className="text-[11px] text-slate-500">
                  No segments assigned yet.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Add segment</span>
              <select
                onChange={(e) => {
                  const segId = e.target.value;
                  if (!segId) return;
                  assignSegmentToPlayer(playerId, segId);
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-52 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              >
                <option value="">Select segment</option>
                {state.segments
                  .filter((s) => !(player.segments ?? []).includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </Card>

        <Card
          title="Summary"
          description="Key signals for this player."
        >
          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Open Alerts</span>
              <span className="font-semibold">
                {
                  alertsForPlayer.filter((a) => a.status === "open")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Open Cases</span>
              <span className="font-semibold">
                {
                  casesForPlayer.filter((c) => c.status === "Open")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Events</span>
              <span className="font-semibold">{playerEvents.length}</span>
            </div>
          </div>
        </Card>

        <Card
          title="Recent Metrics"
          description="Aggregated and time-windowed activity metrics."
        >
          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Deposits (24h)</span>
              <span className="font-semibold">
                {player.metrics?.deposit_count_24h ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Deposits</span>
              <span className="font-semibold">
                {player.metrics?.total_deposit_amount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Withdrawals (24h)</span>
              <span className="font-semibold">
                {player.metrics?.withdrawal_count_24h ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Withdrawals</span>
              <span className="font-semibold">
                {player.metrics?.total_withdrawal_amount ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bets Placed</span>
              <span className="font-semibold">
                {player.metrics?.bet_count ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Stake</span>
              <span className="font-semibold">
                {player.metrics?.total_stake_amount ?? 0}
              </span>
            </div>
            <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              Recent Activity (Time Windows)
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Deposits (10m)</span>
              <span className="font-semibold">
                {player.metrics?.deposit_count_10m ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Deposits (1h)</span>
              <span className="font-semibold">
                {player.metrics?.deposit_count_1h ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Withdrawals (24h)</span>
              <span className="font-semibold">
                {player.metrics?.withdrawal_count_24h ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bets (10m)</span>
              <span className="font-semibold">
                {player.metrics?.bet_count_10m ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bets (1h)</span>
              <span className="font-semibold">
                {player.metrics?.bet_count_1h ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Alerts"
          description="Alerts raised on this player."
        >
          {alertsForPlayer.length === 0 ? (
            <p className="text-xs text-slate-400">
              No records found.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Alert ID</TH>
                  <TH>Rule</TH>
                  <TH>Severity</TH>
                  <TH>Status</TH>
                  <TH>Timestamp</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {alertsForPlayer.map((a) => (
                  <TR key={a.id}>
                    <TD className="font-mono text-[11px] text-slate-300">
                      {a.id}
                    </TD>
                    <TD className="text-xs text-slate-100">
                      {a.ruleTriggered}
                    </TD>
                    <TD>
                      <Badge
                        variant={
                          a.severity === "Critical"
                            ? "danger"
                            : a.severity === "High" ||
                                a.severity === "Sportsbook"
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
                    <TD className="font-mono text-[11px] text-slate-400">
                      {new Date(a.timestamp).toLocaleString()}
                    </TD>
                    <TD className="text-[11px] text-slate-200">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => router.push("/alerts")}
                          className="rounded-md border border-sky-600 bg-sky-600/10 px-2 py-0.5 text-sky-200 hover:bg-sky-600/20"
                        >
                          Open
                        </button>
                        {a.status === "open" && (
                          <button
                            type="button"
                            onClick={() => resolveAlert(a.id)}
                            className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                          >
                            Resolve
                          </button>
                        )}
                        {a.status === "investigating" && (
                          <button
                            type="button"
                            onClick={() => escalateAlertToCase(a.id)}
                            className="rounded-md border border-amber-600 bg-amber-600/10 px-2 py-0.5 text-amber-200 hover:bg-amber-600/20"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card
          title="Cases"
          description="Investigation cases associated with this player."
        >
          {casesForPlayer.length === 0 ? (
            <p className="text-xs text-slate-400">
              No records found.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Case ID</TH>
                  <TH>Title</TH>
                  <TH>Priority</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {casesForPlayer.map((c) => {
                  const priority = computeCasePriority(c.id);
                  const titleAlert = state.alerts.find((a) =>
                    c.alerts.includes(a.id),
                  );
                  const title =
                    titleAlert?.ruleTriggered ?? `Case for ${playerId}`;
                  return (
                    <TR key={c.id}>
                      <TD className="font-mono text-[11px] text-slate-300">
                        {c.id}
                      </TD>
                      <TD className="text-xs text-slate-100">{title}</TD>
                      <TD>
                        <Badge
                          variant={
                            priority === "High"
                              ? "danger"
                              : priority === "Medium"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {priority}
                        </Badge>
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
                      <TD className="font-mono text-[11px] text-slate-400">
                        {new Date(c.openedAt).toLocaleString()}
                      </TD>
                      <TD className="text-[11px] text-slate-200">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => router.push("/cases")}
                            className="rounded-md border border-sky-600 bg-sky-600/10 px-2 py-0.5 text-sky-200 hover:bg-sky-600/20"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const note = window.prompt("Add note to case:");
                              if (!note) return;
                              setCaseNotes((prev) => ({
                                ...prev,
                                [c.id]: [...(prev[c.id] ?? []), note],
                              }));
                            }}
                            className="rounded-md border border-amber-600 bg-amber-600/10 px-2 py-0.5 text-amber-200 hover:bg-amber-600/20"
                          >
                            Add Note
                          </button>
                          {c.status === "Open" && (
                            <button
                              type="button"
                              onClick={() => closeCase(c.id)}
                              className="rounded-md border border-emerald-600 bg-emerald-600/10 px-2 py-0.5 text-emerald-200 hover:bg-emerald-600/20"
                            >
                              Close
                            </button>
                          )}
                        </div>
                        {(caseNotes[c.id] ?? []).length > 0 && (
                          <ul className="mt-1 list-disc pl-4 text-[10px] text-slate-400">
                            {caseNotes[c.id].map((n, idx) => (
                              <li key={idx}>{n}</li>
                            ))}
                          </ul>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card
          title="High-Risk Bets"
          description="Bets from this player routed to the trading risk monitor."
        >
          {highRiskBetsForPlayer.length === 0 ? (
            <p className="text-xs text-slate-400">
              No records found.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Bet ID</TH>
                  <TH>Event</TH>
                  <TH>Market</TH>
                  <TH>Stake</TH>
                  <TH>Odds</TH>
                  <TH>Possible Payout</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {highRiskBetsForPlayer.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-mono text-[11px] text-slate-300">
                      {b.id}
                    </TD>
                    <TD className="text-xs text-slate-200">{b.eventName}</TD>
                    <TD className="text-xs text-slate-200">{b.market}</TD>
                    <TD className="text-xs text-slate-200">
                      €{b.stake.toLocaleString()}
                    </TD>
                    <TD className="text-xs text-slate-200">{b.odds}</TD>
                    <TD className="text-xs text-slate-200">
                      €{b.possiblePayout.toLocaleString()}
                    </TD>
                    <TD className="text-[11px] text-slate-200">
                      <Badge
                        variant={
                          b.status === "pending"
                            ? "warning"
                            : b.status === "approved"
                              ? "success"
                              : b.status === "modified"
                                ? "outline"
                                : "danger"
                        }
                      >
                        {b.status}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-[11px] text-slate-400">
                      {new Date(b.createdAt).toLocaleString()}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => router.push("/high-risk-bets")}
              className="text-[11px] text-sky-300 hover:underline"
            >
              View in High-Risk Bets queue →
            </button>
          </div>
        </Card>
      </div>

      <EventTimeline playerId={playerId} />
      <SecuritySignals playerId={playerId} />

      <Card
        title="Player Activity"
        description="Segmented view of events for this player."
      >
        <div className="mb-3 flex gap-2 text-xs">
          {(["casino", "sportsbook", "payments", "security"] as ActivityTab[]).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1 ${
                  activeTab === tab
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/60"
                    : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </div>

        {activityByTab[activeTab].length === 0 ? (
          <p className="text-xs text-slate-400">
            No events in this category yet.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Timestamp</TH>
                <TH>Type</TH>
              </TR>
            </THead>
            <TBody>
              {activityByTab[activeTab].map((e) => (
                <TR key={e.id}>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {new Date(e.timestamp).toLocaleString()}
                  </TD>
                  <TD className="text-xs text-slate-100">
                    {formatEventType(e.eventType)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

