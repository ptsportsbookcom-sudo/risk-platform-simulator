import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ReportsPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Reports</h1>
          <p className="text-xs text-slate-400">
            Placeholder for regulatory, operational, and management reports.
          </p>
        </div>
        <Badge variant="outline">Reporting layer (simulated)</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="SAR / STR Summary" accent="red">
          <p className="text-xs text-slate-300">
            Overview of suspicious activity reports that would be filed to the
            FIU in a production system.
          </p>
        </Card>
        <Card title="Risk KPIs" accent="emerald">
          <p className="text-xs text-slate-300">
            High-level KPIs such as alert conversion, case closure times, and
            exposure by segment.
          </p>
        </Card>
      </div>
    </>
  );
}

