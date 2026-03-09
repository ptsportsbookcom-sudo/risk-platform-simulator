"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";

export default function KycCddPage() {
  const { state } = useRiskEngine();
  const players = Object.values(state.players);

  const pending = players.filter((p) => p.kycStatus === "Pending").length;
  const failed = players.filter((p) => p.kycStatus === "Failed").length;
  const enhanced = players.filter((p) => p.cddTier === "Enhanced").length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">KYC / CDD</h1>
          <p className="text-xs text-slate-400">
            Verification and due diligence workload in the simulator.
          </p>
        </div>
        <Badge variant="outline">Driven by live simulator events</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Pending KYC" accent="amber">
          <p className="text-3xl font-semibold text-amber-300">{pending}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Awaiting document upload or third-party checks.
          </p>
        </Card>
        <Card title="Failed KYC" accent="red">
          <p className="text-3xl font-semibold text-red-300">{failed}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Requires manual review and potential off-boarding.
          </p>
        </Card>
        <Card title="Enhanced CDD" accent="emerald">
          <p className="text-3xl font-semibold text-emerald-300">{enhanced}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Players under enhanced monitoring for source of funds.
          </p>
        </Card>
      </div>
    </>
  );
}

