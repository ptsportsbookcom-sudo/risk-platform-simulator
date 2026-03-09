import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const mockAuditEvents = [
  {
    id: "L-7001",
    actor: "risk.analyst@operator.io",
    action: "Updated case owner",
    entity: "Case C-3001",
    at: "2026-03-09T10:05:00Z",
  },
  {
    id: "L-7002",
    actor: "fraud.lead@operator.io",
    action: "Changed rule threshold",
    entity: "Rule R-1004",
    at: "2026-03-09T09:43:00Z",
  },
];

export default function AuditLogPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Audit Log</h1>
          <p className="text-xs text-slate-400">
            Example operator actions that would be recorded for compliance.
          </p>
        </div>
        <Badge variant="outline">Immutable in production</Badge>
      </div>

      <Card>
        <ul className="space-y-3 text-xs text-slate-200">
          {mockAuditEvents.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono text-slate-500">
                  {e.id}
                </div>
                <div className="mt-0.5 text-xs text-slate-100">
                  {e.actor} &mdash; {e.action}
                </div>
                <div className="text-[11px] text-slate-400">{e.entity}</div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                {new Date(e.at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

