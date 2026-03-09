import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { mockPlayers } from "@/data/mockPlayers";

export default function PlayersPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Players</h1>
          <p className="text-xs text-slate-400">
            Portfolio of players monitored by the risk platform.
          </p>
        </div>
        <Badge variant="outline">
          {mockPlayers.length} players in current simulation
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Player ID</TH>
              <TH>Name</TH>
              <TH>Risk Score</TH>
              <TH>KYC Status</TH>
              <TH>CDD Tier</TH>
              <TH>Alert Count</TH>
              <TH>Last Activity</TH>
            </TR>
          </THead>
          <TBody>
            {mockPlayers.map((p) => (
              <TR key={p.id}>
                <TD className="font-mono text-[11px] text-slate-300">{p.id}</TD>
                <TD className="text-xs text-slate-100">{p.name}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">
                      {p.riskScore}
                    </span>
                    <Badge
                      variant={
                        p.riskBand === "Severe"
                          ? "danger"
                          : p.riskBand === "High"
                            ? "warning"
                            : "success"
                      }
                    >
                      {p.riskBand}
                    </Badge>
                  </div>
                </TD>
                <TD>
                  <Badge
                    variant={
                      p.kycStatus === "Approved"
                        ? "success"
                        : p.kycStatus === "Failed"
                          ? "danger"
                          : "outline"
                    }
                  >
                    {p.kycStatus}
                  </Badge>
                </TD>
                <TD className="text-xs text-slate-200">{p.cddTier}</TD>
                <TD className="text-xs text-slate-200">{p.alertCount}</TD>
                <TD className="font-mono text-[11px] text-slate-400">
                  {new Date(p.lastActivity).toLocaleString()}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

