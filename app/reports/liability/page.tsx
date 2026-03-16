"use client";

import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

export default function LiabilityReportPage() {
  const { state } = useRiskEngine();

  const playerLiabilityEntries = Object.entries(state.playerLiability ?? {});
  const eventLiabilityEntries = Object.entries(state.eventLiability ?? {});
  const marketLiabilityEntries = Object.entries(state.marketLiability ?? {});

  const topPlayers = playerLiabilityEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topEvents = eventLiabilityEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topMarkets = marketLiabilityEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Sportsbook Liability
          </h1>
          <p className="text-xs text-slate-400">
            Lightweight view of simulated sportsbook exposure by player, event,
            and market.
          </p>
        </div>
        <Badge variant="outline">Simulated liability</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Tracked Players">
          <p className="text-3xl font-semibold text-slate-50">
            {playerLiabilityEntries.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Players with at least one sportsbook bet.
          </p>
        </Card>
        <Card title="Tracked Events">
          <p className="text-3xl font-semibold text-slate-50">
            {eventLiabilityEntries.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Events with accumulated payout exposure.
          </p>
        </Card>
        <Card title="Tracked Markets">
          <p className="text-3xl font-semibold text-slate-50">
            {marketLiabilityEntries.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Markets with accumulated payout exposure.
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Top Players by Liability">
          {topPlayers.length === 0 ? (
            <p className="text-xs text-slate-400">
              No sportsbook liability recorded yet.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Player</TH>
                  <TH className="text-right">Liability</TH>
                </TR>
              </THead>
              <TBody>
                {topPlayers.map(([playerId, value]) => (
                  <TR key={playerId}>
                    <TD className="text-[11px] text-slate-200">{playerId}</TD>
                    <TD className="text-right text-[11px] text-slate-100">
                      €{value.toLocaleString()}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card title="Top Events by Liability">
          {topEvents.length === 0 ? (
            <p className="text-xs text-slate-400">
              No sportsbook liability recorded yet.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Event</TH>
                  <TH className="text-right">Liability</TH>
                </TR>
              </THead>
              <TBody>
                {topEvents.map(([eventId, value]) => (
                  <TR key={eventId}>
                    <TD className="text-[11px] text-slate-200">
                      {eventId}
                    </TD>
                    <TD className="text-right text-[11px] text-slate-100">
                      €{value.toLocaleString()}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card title="Top Markets by Liability">
          {topMarkets.length === 0 ? (
            <p className="text-xs text-slate-400">
              No sportsbook liability recorded yet.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Market</TH>
                  <TH className="text-right">Liability</TH>
                </TR>
              </THead>
              <TBody>
                {topMarkets.map(([marketId, value]) => (
                  <TR key={marketId}>
                    <TD className="text-[11px] text-slate-200">
                      {marketId}
                    </TD>
                    <TD className="text-right text-[11px] text-slate-100">
                      €{value.toLocaleString()}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

