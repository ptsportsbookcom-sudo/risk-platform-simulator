import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function BulkActionsPage() {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Bulk Actions</h1>
          <p className="text-xs text-slate-400">
            Simulated bulk operations such as freezing accounts or applying
            limits.
          </p>
        </div>
        <Badge variant="outline">Simulation only</Badge>
      </div>

      <Card
        title="Example bulk workflows"
        description="These illustrate typical actions a fraud backoffice could support."
      >
        <ul className="space-y-2 text-xs text-slate-300">
          <li>&bull; Temporarily suspend a cluster of players by segment.</li>
          <li>&bull; Apply stake limits on high-risk cohorts.</li>
          <li>&bull; Trigger outreach flows for affordability checks.</li>
        </ul>
      </Card>
    </>
  );
}

