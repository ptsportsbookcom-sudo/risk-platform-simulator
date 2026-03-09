"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { EventTimeline } from "@/components/player/EventTimeline";
import { SecuritySignals } from "@/components/player/SecuritySignals";

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

  const { state, updatePlayerStatus } = useRiskEngine();
  const [activeTab, setActiveTab] = useState<ActivityTab>("casino");

  const player = state.players[playerId];

  const playerEvents = useMemo(
    () =>
      state.events
        .filter((e) => e.playerId === playerId)
        .slice()
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
    [state.events, playerId],
  );

  const alertsForPlayer = state.alerts.filter((a) => a.playerId === playerId);
  const casesForPlayer = state.cases.filter((c) => c.playerId === playerId);

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
              <span className="text-slate-400">Risk Score</span>
              <span className="text-sm font-semibold text-slate-50">
                {player.riskScore}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Level</span>
              <Badge
                variant={
                  player.riskLevel === "Critical"
                    ? "danger"
                    : player.riskLevel === "High"
                      ? "warning"
                      : "success"
                }
              >
                {player.riskLevel}
              </Badge>
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
                      {s}
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
          title="Summary"
          description="Key signals for this player."
        >
          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Open Alerts</span>
              <span className="font-semibold">
                {
                  alertsForPlayer.filter((a) => a.status === "Open")
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Alerts"
          description="Alerts raised on this player."
        >
          {alertsForPlayer.length === 0 ? (
            <p className="text-xs text-slate-400">
              No alerts for this player yet.
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
                          a.status === "Closed"
                            ? "success"
                            : a.status === "Open"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {a.status}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-[11px] text-slate-400">
                      {new Date(a.timestamp).toLocaleString()}
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
              No cases opened for this player yet.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Case ID</TH>
                  <TH>Priority</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {casesForPlayer.map((c) => {
                  const priority = computeCasePriority(c.id);
                  return (
                    <TR key={c.id}>
                      <TD className="font-mono text-[11px] text-slate-300">
                        {c.id}
                      </TD>
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
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
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
                <TH>Δ Risk</TH>
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
                  <TD className="text-xs text-slate-200">
                    {e.riskDelta >= 0 ? `+${e.riskDelta}` : e.riskDelta}
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

