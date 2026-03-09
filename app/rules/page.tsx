"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import type { Rule } from "@/modules/risk-engine/ruleTypes";
import { useMemo, useState } from "react";

function summarizeActions(actions: Rule["actions"]) {
  const parts: string[] = [];
  for (const a of actions) {
    if (a.type === "riskScoreIncrease") {
      parts.push(`+${a.value} risk`);
    } else if (a.type === "createAlert") {
      parts.push(`Alert (${a.severity})`);
    } else if (a.type === "createCase") {
      parts.push("Case");
    } else if (a.type === "assignSegment") {
      parts.push(`Segment: ${a.value}`);
    }
  }
  return parts.join(", ");
}

const EVENT_TYPES = [
  "any",
  "login",
  "deposit",
  "withdraw",
  "bonus_claim",
  "casino_session",
  "place_bet",
  "large_bet",
  "vpn_login",
  "multi_device_login",
  "chargeback",
  "kyc_failure",
  "cdd_threshold_breach",
] as const;

const CONDITION_FIELDS = ["amount", "segments", "riskScore"] as const;

const OPERATORS = ["equals", "greater_than", "less_than", "contains"] as const;

export default function RulesPage() {
  const { state, addRule, toggleRule, updateRule, removeRule } = useRiskEngine();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]>("any");
  const [enabled, setEnabled] = useState(true);

  const [conditions, setConditions] = useState<
    { field: (typeof CONDITION_FIELDS)[number]; operator: (typeof OPERATORS)[number]; value: string }[]
  >([]);

  const [riskIncrease, setRiskIncrease] = useState<string>("0");
  const [createAlert, setCreateAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] =
    useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [createCase, setCreateCase] = useState(false);
  const [segmentValue, setSegmentValue] = useState("");
  const [assignSegment, setAssignSegment] = useState(false);

  const rules = useMemo(() => state.rules ?? [], [state.rules]);

  function resetForm() {
    setEditingRuleId(null);
    setName("");
    setDescription("");
    setEventType("any");
    setEnabled(true);
    setConditions([]);
    setRiskIncrease("0");
    setCreateAlert(false);
    setAlertSeverity("Medium");
    setCreateCase(false);
    setSegmentValue("");
    setAssignSegment(false);
  }

  function handleAddCondition() {
    setConditions((prev) => [
      ...prev,
      { field: "amount", operator: "greater_than", value: "0" },
    ]);
  }

  function handleConditionChange(
    index: number,
    key: "field" | "operator" | "value",
    value: string,
  ) {
    setConditions((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              [key]: value,
            }
          : c,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const actions: Rule["actions"] = [];
    const numericRisk = Number(riskIncrease);
    if (!Number.isNaN(numericRisk) && numericRisk !== 0) {
      actions.push({ type: "riskScoreIncrease", value: numericRisk });
    }
    if (createAlert) {
      actions.push({ type: "createAlert", severity: alertSeverity });
    }
    if (createCase) {
      actions.push({ type: "createCase" });
    }
    if (assignSegment && segmentValue.trim()) {
      actions.push({ type: "assignSegment", value: segmentValue.trim() });
    }

    if (editingRuleId) {
      // Update existing rule
      const existing = rules.find((r) => r.id === editingRuleId);
      if (existing) {
        updateRule(editingRuleId, {
          name: name.trim(),
          description: description.trim() || undefined,
          enabled,
          eventType: eventType === "any" ? "any" : eventType,
          conditions: conditions.map((c) => ({
            field: c.field,
            operator: c.operator,
            value:
              c.field === "amount" || c.operator !== "equals"
                ? Number(c.value)
                : c.value,
          })),
          actions,
        });
      }
    } else {
      // Create new rule
      const id = `rule_${Date.now()}`;
      const rule: Rule = {
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        enabled,
        type: "custom",
        eventType: eventType === "any" ? "any" : eventType,
        conditions: conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value:
            c.field === "amount" || c.operator !== "equals"
              ? Number(c.value)
              : c.value,
        })),
        actions,
      };
      addRule(rule);
    }

    resetForm();
    setIsModalOpen(false);
  }

  function handleEdit(rule: Rule) {
    setEditingRuleId(rule.id);
    setName(rule.name);
    setDescription(rule.description ?? "");
    setEventType((rule.eventType as (typeof EVENT_TYPES)[number]) ?? "any");
    setEnabled(rule.enabled);

    setConditions(
      (rule.conditions ?? []).map((c) => ({
        field: c.field as (typeof CONDITION_FIELDS)[number],
        operator: c.operator as (typeof OPERATORS)[number],
        value: String(c.value ?? ""),
      })),
    );

    const risk = rule.actions.find((a) => a.type === "riskScoreIncrease");
    setRiskIncrease(
      risk && "value" in risk ? String((risk as any).value ?? "0") : "0",
    );

    const alert = rule.actions.find((a) => a.type === "createAlert");
    setCreateAlert(!!alert);
    setAlertSeverity(
      (alert && "severity" in alert
        ? (alert as any).severity
        : "Medium") as "Low" | "Medium" | "High" | "Critical",
    );

    const hasCase = rule.actions.some((a) => a.type === "createCase");
    setCreateCase(hasCase);

    const seg = rule.actions.find((a) => a.type === "assignSegment");
    setAssignSegment(!!seg);
    setSegmentValue(
      seg && "value" in seg ? String((seg as any).value ?? "") : "",
    );

    setIsModalOpen(true);
  }

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Rules</h1>
          <p className="text-xs text-slate-400">
            Hybrid rule system combining built-in and custom rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{rules.length} rules</Badge>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="rounded-md border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Create Rule
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-slate-200">
          <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Rule Name</th>
              <th className="px-3 py-2.5 font-semibold">Type</th>
              <th className="px-3 py-2.5 font-semibold">Event</th>
              <th className="px-3 py-2.5 font-semibold">Enabled</th>
              <th className="px-3 py-2.5 font-semibold">Actions</th>
              <th className="px-3 py-2.5 font-semibold">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-900/60">
                <td className="px-3 py-2 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-100">{r.name}</span>
                    {r.description && (
                      <span className="text-[11px] text-slate-400">
                        {r.description}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500">
                      {r.id}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 align-middle">
                  <Badge variant={r.type === "system" ? "outline" : "success"}>
                    {r.type}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-middle text-xs text-slate-200">
                  {r.eventType ?? "any"}
                </td>
                <td className="px-3 py-2 align-middle">
                  <Badge variant={r.enabled ? "success" : "outline"}>
                    {r.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-middle text-[11px] text-slate-400">
                  {summarizeActions(r.actions) || "—"}
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleEdit(r)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 hover:border-sky-500/70 hover:text-sky-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRule(r.id)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 hover:border-emerald-500/70 hover:text-emerald-200"
                    >
                      {r.enabled ? "Disable" : "Enable"}
                    </button>
                    {r.type === "custom" && (
                      <button
                        type="button"
                        onClick={() => removeRule(r.id)}
                        className="rounded-md border border-red-700 bg-red-900/40 px-2 py-0.5 text-red-200 hover:border-red-500 hover:bg-red-900/70"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-3 text-center text-xs text-slate-400"
                >
                  No rules configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl shadow-black/60">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-50">
                {editingRuleId ? "Edit Rule" : "Create Custom Rule"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300">Rule Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="block text-slate-300">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) =>
                      setEventType(e.target.value as (typeof EVENT_TYPES)[number])
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-300">Enabled</label>
                  <button
                    type="button"
                    onClick={() => setEnabled((v) => !v)}
                    className={`mt-1 rounded-full border px-3 py-1 text-[11px] ${
                      enabled
                        ? "border-emerald-500/70 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-600 bg-slate-900 text-slate-300"
                    }`}
                  >
                    {enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">Conditions</span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-[11px] text-emerald-300 hover:underline"
                  >
                    + Add condition
                  </button>
                </div>
                {conditions.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    No conditions set. Rule will match any event of the selected
                    type.
                  </p>
                )}
                {conditions.map((c, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={c.field}
                      onChange={(e) =>
                        handleConditionChange(
                          idx,
                          "field",
                          e.target.value as (typeof CONDITION_FIELDS)[number],
                        )
                      }
                      className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                    >
                      {CONDITION_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <select
                      value={c.operator}
                      onChange={(e) =>
                        handleConditionChange(
                          idx,
                          "operator",
                          e.target.value as (typeof OPERATORS)[number],
                        )
                      }
                      className="w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                    >
                      {OPERATORS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) =>
                        handleConditionChange(idx, "value", e.target.value)
                      }
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                      placeholder="Value"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                <span className="text-slate-200">Actions</span>
                <div className="grid gap-2 text-[11px] md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-slate-300">
                      Risk score increase
                    </label>
                    <input
                      type="number"
                      value={riskIncrease}
                      onChange={(e) => setRiskIncrease(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300">
                      Create alert
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createAlert}
                        onChange={(e) => setCreateAlert(e.target.checked)}
                      />
                      <select
                        value={alertSeverity}
                        onChange={(e) =>
                          setAlertSeverity(
                            e.target.value as
                              | "Low"
                              | "Medium"
                              | "High"
                              | "Critical",
                          )
                        }
                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300">Create case</label>
                    <input
                      type="checkbox"
                      checked={createCase}
                      onChange={(e) => setCreateCase(e.target.checked)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-300">
                      Assign segment
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignSegment}
                        onChange={(e) => setAssignSegment(e.target.checked)}
                      />
                      <input
                        value={segmentValue}
                        onChange={(e) => setSegmentValue(e.target.value)}
                        className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                        placeholder="Segment name"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-emerald-500/70 bg-emerald-500/20 px-3 py-1 font-medium text-emerald-100 hover:bg-emerald-500/30"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

