import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { mockAlerts } from "@/data/mockAlerts";

export default function AlertsPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Alerts</h1>
          <p className="text-xs text-slate-400">
            Triggered rules awaiting triage or investigation.
          </p>
        </div>
        <Badge variant="outline">
          {mockAlerts.filter((a) => a.status !== "Closed").length} active
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Alert ID</TH>
              <TH>Rule</TH>
              <TH>Player</TH>
              <TH>Severity</TH>
              <TH>Timestamp</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {mockAlerts.map((a) => (
              <TR key={a.id}>
                <TD className="font-mono text-[11px] text-slate-300">{a.id}</TD>
                <TD className="text-xs text-slate-100">{a.ruleName}</TD>
                <TD className="text-xs text-slate-200">
                  {a.playerName} ({a.playerId})
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
                <TD className="font-mono text-[11px] text-slate-400">
                  {new Date(a.createdAt).toLocaleString()}
                </TD>
                <TD>
                  <Badge
                    variant={
                      a.status === "Closed"
                        ? "success"
                        : a.status === "Escalated"
                          ? "danger"
                          : "outline"
                    }
                  >
                    {a.status}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

