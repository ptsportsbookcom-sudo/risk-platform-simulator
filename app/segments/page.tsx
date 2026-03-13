"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TH, TR, TD } from "@/components/ui/Table";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import type {
  Segment,
  SegmentCondition,
  SegmentMatchMode,
  SegmentType,
} from "@/modules/segmentation/segmentTypes";

type SegmentConditionForm = {
  field: string;
  operator: SegmentCondition["operator"];
  value: string;
};

type SegmentFormState = {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: SegmentType;
  matchMode: SegmentMatchMode;
  conditions: SegmentConditionForm[];
  includePlayersText: string;
  excludePlayersText: string;
};

const DOMAIN_OPTIONS = [
  "sportsbook_trading",
  "fraud_abuse",
  "aml_compliance",
  "operations",
  "responsible_gambling",
] as const;

const CONDITION_FIELDS = [
  "country",
  "registration_date",
  "tier_level",
  "affiliate",
  "agent",
  "deposit_count",
  "withdrawal_count",
  "deposit_amount",
  "withdrawal_amount",
  "wallet_currency",
  "deposit_method",
  "withdrawal_method",
  "language",
  "asn",
  "bonus_claim_count",
  "bet_count",
] as const;

const CONDITION_OPERATORS: SegmentCondition["operator"][] = [
  ">",
  "<",
  "=",
  "in",
  "not_in",
];

function createEmptyForm(): SegmentFormState {
  return {
    id: "",
    name: "",
    description: "",
    domain: "fraud_abuse",
    type: "static",
    matchMode: "all",
    conditions: [],
    includePlayersText: "",
    excludePlayersText: "",
  };
}

export default function SegmentsPage() {
  const {
    state,
    createSegment,
    updateSegment,
    deleteSegment,
  } = useRiskEngine();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SegmentFormState>(createEmptyForm);

  const segments = state.segments ?? [];
  const players = Object.values(state.players);

  function openCreate() {
    setEditingId(null);
    setForm(createEmptyForm());
    setIsModalOpen(true);
  }

  function openEdit(seg: Segment) {
    setEditingId(seg.id);
    setForm({
      id: seg.id,
      name: seg.name,
      description: seg.description ?? "",
      domain: seg.domain ?? "fraud_abuse",
      type: seg.type ?? "static",
      matchMode: seg.matchMode ?? "all",
      conditions: (seg.conditions ?? []).map((c) => ({
        field: c.field,
        operator: c.operator,
        value: Array.isArray(c.value) ? c.value.join(",") : String(c.value),
      })),
      includePlayersText: (seg.includePlayers ?? []).join(","),
      excludePlayersText: (seg.excludePlayers ?? []).join(","),
    });
    setIsModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const conditions: SegmentCondition[] = form.conditions.map((c) => {
      const trimmed = c.value.trim();
      let value: number | string | string[] = trimmed;
      if (c.operator === "in" || c.operator === "not_in") {
        value = trimmed
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
        value = Number(trimmed);
      }
      return {
        field: c.field,
        operator: c.operator,
        value,
      };
    });

    const includePlayers = form.includePlayersText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const excludePlayers = form.excludePlayersText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const base: Segment = {
      id: form.id || form.name.trim().toLowerCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      domain: form.domain || undefined,
      createdAt: Date.now(),
      type: form.type,
      matchMode: form.matchMode,
      conditions: conditions.length > 0 ? conditions : undefined,
      includePlayers: includePlayers.length > 0 ? includePlayers : undefined,
      excludePlayers: excludePlayers.length > 0 ? excludePlayers : undefined,
    };

    if (editingId) {
      updateSegment(editingId, {
        name: base.name,
        description: base.description,
        domain: base.domain,
        type: base.type,
        matchMode: base.matchMode,
        conditions: base.conditions,
        includePlayers: base.includePlayers,
        excludePlayers: base.excludePlayers,
      });
    } else {
      createSegment(base);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this segment? This will remove it from all players.")) {
      return;
    }
    deleteSegment(id);
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Segments</h1>
          <p className="text-xs text-slate-400">
            Manage player segments used by rules and operators.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
        >
          + Create Segment
        </button>
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Name</TH>
              <TH>Description</TH>
              <TH>Domain</TH>
              <TH>Type</TH>
              <TH>Players</TH>
              <TH>Created</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {segments.map((seg) => {
              const count = players.filter((p) =>
                (p.segments ?? []).includes(seg.id),
              ).length;
              return (
                <TR key={seg.id}>
                  <TD className="font-mono text-[11px] text-slate-400">
                    {seg.id}
                  </TD>
                  <TD className="text-xs text-slate-100">{seg.name}</TD>
                  <TD className="text-[11px] text-slate-300">
                    {seg.description ?? "—"}
                  </TD>
                  <TD className="text-[11px] text-slate-300">
                    <Badge variant="outline">{seg.domain ?? "—"}</Badge>
                  </TD>
                  <TD className="text-[11px] text-slate-300">
                    <Badge variant="outline">
                      {seg.type ?? "static"}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-slate-200">{count}</TD>
                  <TD className="text-[11px] text-slate-400">
                    {seg.createdAt
                      ? new Date(seg.createdAt).toLocaleDateString()
                      : "—"}
                  </TD>
                  <TD>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => openEdit(seg)}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 hover:border-sky-500/70 hover:text-sky-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(seg.id)}
                        className="rounded-md border border-red-700 bg-red-900/40 px-2 py-0.5 text-red-200 hover:border-red-500 hover:bg-red-900/70"
                      >
                        Delete
                      </button>
                    </div>
                  </TD>
                </TR>
              );
            })}
            {segments.length === 0 && (
              <TR>
                <TD
                  colSpan={7}
                  className="px-3 py-3 text-center text-xs text-slate-400"
                >
                  No segments configured yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-black/60">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">
                {editingId ? "Edit Segment" : "Create Segment"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setForm(createEmptyForm());
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300">Segment Name</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300">Domain</label>
                <select
                  value={form.domain}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, domain: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-slate-300">
                    Segment Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as SegmentType,
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  >
                    <option value="static">Static (manual)</option>
                    <option value="dynamic">Dynamic (condition-based)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-300">
                    Condition Logic
                  </label>
                  <select
                    value={form.matchMode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        matchMode: e.target.value as SegmentMatchMode,
                      }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                    disabled={form.type !== "dynamic"}
                  >
                    <option value="all">All conditions (AND)</option>
                    <option value="any">Any condition (OR)</option>
                  </select>
                </div>
              </div>

              {form.type === "dynamic" && (
                <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/70 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200">
                      Conditions
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          conditions: [
                            ...f.conditions,
                            {
                              field: "country",
                              operator: "=",
                              value: "",
                            },
                          ],
                        }))
                      }
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                    >
                      + Add Condition
                    </button>
                  </div>
                  {form.conditions.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      No conditions defined. This dynamic segment will not match
                      any players until you add at least one condition.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {form.conditions.map((cond, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1.3fr,1fr,1.7fr,auto] items-center gap-1"
                        >
                          <select
                            value={cond.field}
                            onChange={(e) =>
                              setForm((f) => {
                                const next = [...f.conditions];
                                next[idx] = {
                                  ...next[idx],
                                  field: e.target.value,
                                };
                                return { ...f, conditions: next };
                              })
                            }
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
                          >
                            {CONDITION_FIELDS.map((field) => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))}
                          </select>
                          <select
                            value={cond.operator}
                            onChange={(e) =>
                              setForm((f) => {
                                const next = [...f.conditions];
                                next[idx] = {
                                  ...next[idx],
                                  operator: e.target
                                    .value as SegmentCondition["operator"],
                                };
                                return { ...f, conditions: next };
                              })
                            }
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
                          >
                            {CONDITION_OPERATORS.map((op) => (
                              <option key={op} value={op}>
                                {op}
                              </option>
                            ))}
                          </select>
                          <input
                            value={cond.value}
                            onChange={(e) =>
                              setForm((f) => {
                                const next = [...f.conditions];
                                next[idx] = {
                                  ...next[idx],
                                  value: e.target.value,
                                };
                                return { ...f, conditions: next };
                              })
                            }
                            placeholder={
                              cond.operator === "in" ||
                              cond.operator === "not_in"
                                ? "Comma-separated values"
                                : "Value"
                            }
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                conditions: f.conditions.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="ml-1 rounded-md border border-red-700 bg-red-900/40 px-2 py-0.5 text-[11px] text-red-200 hover:border-red-500 hover:bg-red-900/70"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-slate-300">
                    Manual Include Players
                  </label>
                  <textarea
                    value={form.includePlayersText}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        includePlayersText: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Comma-separated player IDs to always include"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-300">
                    Manual Exclude Players
                  </label>
                  <textarea
                    value={form.excludePlayersText}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        excludePlayersText: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Comma-separated player IDs to always exclude"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setForm(createEmptyForm());
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-500/70 bg-emerald-500/20 px-3 py-1 text-[11px] font-medium text-emerald-100 hover:bg-emerald-500/30"
                >
                  {editingId ? "Save Changes" : "Create Segment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

