"use client";

import { useMemo, useState } from "react";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import {
  getPendingKycDocuments,
  pendingKycDocumentsToCsv,
  type PendingKycFilters,
} from "@/modules/compliance/pendingKycDocuments";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PendingKycPage() {
  const { state } = useRiskEngine();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [partner, setPartner] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [verificationType, setVerificationType] = useState("");
  const [country, setCountry] = useState("");

  const filters: PendingKycFilters | undefined = useMemo(() => {
    const dateRange =
      from && to
        ? {
            from,
            to,
          }
        : undefined;
    return {
      dateRange,
      partner: partner || undefined,
      jurisdiction: jurisdiction || undefined,
      verificationType: verificationType || undefined,
      country: country || undefined,
    };
  }, [from, to, partner, jurisdiction, verificationType, country]);

  const rows = useMemo(
    () => getPendingKycDocuments(state, filters),
    [state, filters],
  );

  const handleExport = () => {
    const csv = pendingKycDocumentsToCsv(rows);
    downloadCsv("pending_kyc_documents.csv", csv);
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Pending KYC Documents
          </h1>
          <p className="text-xs text-slate-400">
            Players with pending KYC verification for compliance follow-up.
          </p>
        </div>
        <Badge variant="outline">{rows.length} records</Badge>
      </div>

      <Card
        title="Filters"
        description="Filter pending KYC cases by time window, partner, jurisdiction and country."
      >
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">From</span>
            <input
              type="date"
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">To</span>
            <input
              type="date"
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Partner</span>
            <input
              type="text"
              placeholder="Any"
              className="w-32 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Jurisdiction</span>
            <input
              type="text"
              placeholder="Any"
              className="w-32 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Verification Type</span>
            <input
              type="text"
              placeholder="Any"
              className="w-40 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">Country</span>
            <input
              type="text"
              placeholder="Any"
              className="w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Export CSV
          </button>
        </div>
      </Card>

      <Card
        title="Results"
        description="Pending KYC verification entries."
      >
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">No records for the selected filters.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Jurisdiction</TH>
                <TH>Partner</TH>
                <TH>Master ID</TH>
                <TH>ECR ID</TH>
                <TH>Upload Time</TH>
                <TH>Verification Type</TH>
                <TH>Document Type</TH>
                <TH>Country</TH>
                <TH>KYC Level</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.ECR_ID}>
                  <TD className="text-[11px]">{row.jurisdiction ?? "-"}</TD>
                  <TD className="text-[11px]">{row.partner ?? "-"}</TD>
                  <TD className="font-mono text-[11px]">
                    {row.masterId ?? "-"}
                  </TD>
                  <TD className="font-mono text-[11px]">{row.ECR_ID}</TD>
                  <TD className="font-mono text-[11px]">
                    {new Date(row.uploadTime).toLocaleString()}
                  </TD>
                  <TD className="text-[11px]">
                    {row.verificationType ?? "-"}
                  </TD>
                  <TD className="text-[11px]">
                    {row.documentType ?? "-"}
                  </TD>
                  <TD className="text-[11px]">{row.country}</TD>
                  <TD className="text-[11px]">{row.kycLevel}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

