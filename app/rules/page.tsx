import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const mockRules = [
  {
    id: "R-1001",
    name: "Rapid deposits from new device",
    vertical: "All",
    severity: "High",
  },
  {
    id: "R-1002",
    name: "VPN / Proxy usage",
    vertical: "All",
    severity: "Medium",
  },
  {
    id: "R-1003",
    name: "High velocity withdrawals",
    vertical: "Casino",
    severity: "High",
  },
  {
    id: "R-1004",
    name: "Large bet outside normal pattern",
    vertical: "Sportsbook",
    severity: "Critical",
  },
];

export default function RulesPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Rules</h1>
          <p className="text-xs text-slate-400">
            Simplified view of detection rules powering the simulator.
          </p>
        </div>
        <Badge variant="outline">{mockRules.length} active rules</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {mockRules.map((r) => (
          <Card key={r.id} title={r.name}>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">
                  {r.id}
                </span>
                <Badge variant="outline">{r.vertical}</Badge>
              </div>
              <Badge
                variant={
                  r.severity === "Critical"
                    ? "danger"
                    : r.severity === "High"
                      ? "warning"
                      : "outline"
                }
              >
                {r.severity}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

