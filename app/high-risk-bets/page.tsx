import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { mockHighRiskBets } from "@/data/mockBets";

export default function HighRiskBetsPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            High Risk Bets
          </h1>
          <p className="text-xs text-slate-400">
            Bets and sessions exceeding configured risk thresholds.
          </p>
        </div>
        <Badge variant="outline">
          {mockHighRiskBets.length} bets flagged in this snapshot
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Bet ID</TH>
              <TH>Player</TH>
              <TH>Vertical</TH>
              <TH>Market</TH>
              <TH>Stake</TH>
              <TH>Potential Win</TH>
              <TH>Placed</TH>
            </TR>
          </THead>
          <TBody>
            {mockHighRiskBets.map((b) => (
              <TR key={b.id}>
                <TD className="font-mono text-[11px] text-slate-300">{b.id}</TD>
                <TD className="text-xs text-slate-200">
                  {b.playerName} ({b.playerId})
                </TD>
                <TD>
                  <Badge variant="outline">{b.vertical}</Badge>
                </TD>
                <TD className="text-xs text-slate-100">{b.market}</TD>
                <TD className="text-xs text-slate-200">
                  €{b.stake.toLocaleString()}
                </TD>
                <TD className="text-xs text-slate-200">
                  €{b.potentialWin.toLocaleString()}
                </TD>
                <TD className="font-mono text-[11px] text-slate-400">
                  {new Date(b.placedAt).toLocaleString()}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

