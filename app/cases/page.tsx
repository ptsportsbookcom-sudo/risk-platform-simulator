import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { mockCases } from "@/data/mockCases";

export default function CasesPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Cases</h1>
          <p className="text-xs text-slate-400">
            Investigation cases created from alerts and manual reviews.
          </p>
        </div>
        <Badge variant="outline">
          {mockCases.length} cases in this simulation
        </Badge>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Case ID</TH>
              <TH>Title</TH>
              <TH>Player</TH>
              <TH>Owner</TH>
              <TH>Status</TH>
              <TH>Alerts</TH>
              <TH>Opened</TH>
              <TH>Last Updated</TH>
            </TR>
          </THead>
          <TBody>
            {mockCases.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-[11px] text-slate-300">{c.id}</TD>
                <TD className="text-xs text-slate-100">{c.title}</TD>
                <TD className="text-xs text-slate-200">{c.playerId}</TD>
                <TD className="text-xs text-slate-200">{c.owner}</TD>
                <TD>
                  <Badge
                    variant={
                      c.status.startsWith("Closed")
                        ? "success"
                        : c.status === "Investigating"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {c.status}
                  </Badge>
                </TD>
                <TD className="text-xs text-slate-200">{c.alertCount}</TD>
                <TD className="font-mono text-[11px] text-slate-400">
                  {new Date(c.openedAt).toLocaleString()}
                </TD>
                <TD className="font-mono text-[11px] text-slate-400">
                  {new Date(c.lastUpdatedAt).toLocaleString()}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}

