"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useRiskEngine } from "@/components/risk/RiskEngineContext";
import type { Rule } from "@/modules/risk-engine/ruleTypes";
import { RULE_TAXONOMY, type RuleDomainKey } from "@/modules/rules/ruleTaxonomy";
import { useMemo, useState } from "react";

function summarizeActions(actions: Rule["actions"]) {
  const parts: string[] = [];
  for (const a of actions) {
    const type = (a as any).type as string;

    if (type === "createAlert" || type === "create_alert") {
      parts.push("Alert");
    } else if (type === "createCase" || type === "create_case") {
      parts.push("Case");
    } else if (type === "assignSegment" || type === "assign_segment") {
      const value =
        "value" in a
          ? (a as any).value
          : (a as any).params?.segment ?? (a as any).params?.value;
      parts.push(`Segment: ${value ?? "updated"}`);
    } else if (type === "blockWithdrawal" || type === "block_withdrawal") {
      parts.push("Block Withdrawals");
    } else if (type === "blockDeposit" || type === "block_deposit") {
      parts.push("Block Deposits");
    } else if (type === "limitStake" || type === "limit_stake") {
      const value =
        "value" in a
          ? (a as any).value
          : (a as any).params?.amount ?? (a as any).params?.value;
      parts.push(
        value != null ? `Limit Stake ≤ ${value}` : "Limit Stake",
      );
    } else if (type === "blockBet" || type === "block_bet") {
      parts.push("Block Bets");
    } else if (type === "blockBonus" || type === "block_bonus") {
      parts.push("Block Bonuses");
    } else if (type === "blockGameplay" || type === "block_gameplay") {
      parts.push("Block Gameplay");
    } else if (type === "requireKyc" || type === "require_kyc") {
      parts.push("Require KYC");
    } else if (type === "moveCddTier" || type === "move_cdd_tier") {
      const value =
        "value" in a
          ? (a as any).value
          : (a as any).params?.tier ?? (a as any).params?.value;
      parts.push(`CDD Tier → ${value ?? "updated"}`);
    } else if (type === "freezeAccount" || type === "freeze_account") {
      parts.push("Freeze Account");
    } else if (type === "closeAccount" || type === "close_account") {
      parts.push("Close Account");
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

const DOMAIN_OPTIONS = Object.keys(RULE_TAXONOMY) as RuleDomainKey[];

// Base fields that conditions can target. Time-window metrics are assembled
// from these base metric names plus a selected window (e.g. deposit_count + 10m).
const CONDITION_FIELDS = [
  // event fields
  "event.amount",
  "event.currency",
  "event.type",
  "event.country",
  "event.deviceId",
  "event.device",
  "event.ip",
  "event.timestamp",
  "event.product",
  "event.sport",
  "event.marketType",
  "event.betType",
  "event.gameType",
  "event.provider",
  // player synthetic fields
  "player.depositCount24h",
  "player.withdrawalCount24h",
  "player.betCount24h",
  "player.deviceCount",
  "player.sessionCount",
  // generic fields (backwards compatible)
  "amount",
  "segments",
  // base metrics (windowed via UI)
  "deposit_count",
  "withdrawal_count",
  "bet_count",
  "login_count",
  "casino_session_count",
  // aggregate totals
  "total_deposit_amount",
  "total_withdrawal_amount",
  "bonus_claim_count",
  "total_stake_amount",
  // sportsbook exposure metrics
  "stake_amount",
  "possible_payout",
  "total_stake_event",
  "total_stake_market",
  "total_payout_exposure_event",
  "total_payout_exposure_market",
  "net_exposure_event",
] as const;

const METRIC_BASE_FIELDS = [
  "deposit_count",
  "withdrawal_count",
  "bet_count",
  "login_count",
  "casino_session_count",
] as const;

const TIME_WINDOWS = [
  { id: "none", label: "Any time" },
  { id: "5m", label: "5 minutes" },
  { id: "10m", label: "10 minutes" },
  { id: "30m", label: "30 minutes" },
  { id: "1h", label: "1 hour" },
  { id: "24h", label: "24 hours" },
] as const;

const OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "greater_or_equals",
  "less_or_equals",
  "contains",
  "in",
] as const;

const OPERATOR_LABELS: Record<(typeof OPERATORS)[number], string> = {
  equals: "==",
  not_equals: "!=",
  greater_than: ">",
  less_than: "<",
  greater_or_equals: ">=",
  less_or_equals: "<=",
  contains: "contains",
  in: "in",
};

export default function RulesPage() {
  const { state, addRule, toggleRule, updateRule, removeRule } = useRiskEngine();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]>("any");
  const [enabled, setEnabled] = useState(true);
  const [domain, setDomain] =
    useState<(typeof DOMAIN_OPTIONS)[number]>("operations");
  const [group, setGroup] = useState<string>("");

  const [conditions, setConditions] = useState<
    {
      field: (typeof CONDITION_FIELDS)[number];
      operator: (typeof OPERATORS)[number];
      value: string;
      window?: string;
    }[]
  >([]);

  const [actions, setActions] = useState<
    { type: string; params: Record<string, unknown> }[]
  >([{ type: "create_alert", params: {} }]);
  const [severity, setSeverity] =
    useState<"critical" | "high" | "medium" | "low">("medium");

  const rules = useMemo(() => state.rules ?? [], [state.rules]);
  const [domainFilter, setDomainFilter] = useState<"all" | RuleDomainKey>(
    "all",
  );
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const filteredRules = useMemo(() => {
    let base = rules;

    if (domainFilter !== "all") {
      base = base.filter(
        (r) => (r.domain ?? "operations") === domainFilter,
      );
    }

    if (groupFilter !== "all") {
      base = base.filter(
        (r) => (r.group ?? "manual_review") === groupFilter,
      );
    }

    return base;
  }, [rules, domainFilter, groupFilter]);

  const availableGroupsForDomain = useMemo(
    () => RULE_TAXONOMY[domain as RuleDomainKey] ?? [],
    [domain],
  );

  const allGroups = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(RULE_TAXONOMY).flatMap(
            (groups) => groups as unknown as string[],
          ),
        ),
      ),
    [],
  );

  const availableGroupsForFilter = useMemo(() => {
    if (domainFilter === "all") {
      return allGroups;
    }
    return RULE_TAXONOMY[domainFilter] ?? [];
  }, [allGroups, domainFilter]);

  function resetForm() {
    setEditingRuleId(null);
    setName("");
    setDescription("");
    setEventType("any");
    setEnabled(true);
    setDomain("operations");
    setGroup("");
    setConditions([]);
    setSeverity("medium");
    setActions([{ type: "create_alert", params: {} }]);
  }

  function handleAddCondition() {
    setConditions((prev) => [
      ...prev,
      { field: "amount", operator: "greater_than", value: "0", window: "none" },
    ]);
  }

  function handleConditionChange(
    index: number,
    key: "field" | "operator" | "value" | "window",
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

    // Domain & group validation against taxonomy
    const domainKey = domain as RuleDomainKey;
    const allowedGroups = (RULE_TAXONOMY[domainKey] ?? []) as unknown as string[];
    if (!domainKey || allowedGroups.length === 0) {
      alert("Please select a valid risk domain.");
      return;
    }
    if (!group || !allowedGroups.includes(group)) {
      alert("Please select a valid rule group for the chosen domain.");
      return;
    }

    // Map UI actions (snake_case + params) into engine RuleAction union (camelCase + value)
    // Basic validation for required action params (e.g. assign_segment must have a value)
    for (const a of actions) {
      if (a.type === "assign_segment") {
        const seg = (a.params as Record<string, unknown> | undefined)?.segment;
        if (!seg || String(seg).trim().length === 0) {
          alert("Please provide a segment value for the assign_segment action.");
          return;
        }
      }
    }

    const actionsPayload: Rule["actions"] = actions.map((a) => {
      const params = (a.params ?? {}) as Record<string, unknown>;
      switch (a.type) {
        case "create_alert":
          return { type: "createAlert" };
        case "create_case":
          return { type: "createCase" };
        case "assign_segment":
          return {
            type: "assignSegment",
            value: (params.segment ?? params.value) as string | undefined,
          };
        case "block_withdrawal":
          return { type: "blockWithdrawal" };
        case "block_deposit":
          return { type: "blockDeposit" };
        case "block_bet":
          return { type: "blockBet" };
        case "block_bonus":
          return { type: "blockBonus" };
        case "block_gameplay":
          return { type: "blockGameplay" };
        case "require_kyc":
          return { type: "requireKyc" };
        case "freeze_account":
          return { type: "freezeAccount" };
        case "close_account":
          return { type: "closeAccount" };
        case "limit_stake":
          return {
            type: "limitStake",
            value: params.amount as number | undefined,
          };
        case "move_cdd_tier":
          return {
            type: "moveCddTier",
            value: (params.tier ?? params.value) as string | undefined,
          };
        default:
          // Unknown/legacy types: pass through as-is for forwards-compatibility
          return a as any;
      }
    });

    const metricBases = new Set<string>(METRIC_BASE_FIELDS as unknown as string[]);

    const mapConditionToRule = (c: {
      field: (typeof CONDITION_FIELDS)[number];
      operator: (typeof OPERATORS)[number];
      value: string;
      window?: string;
    }) => {
      let field: string = c.field;
      // If this is a metric base field and a window is selected, assemble
      // the final metric name (e.g. deposit_count + 10m => deposit_count_10m).
      if (metricBases.has(c.field) && c.window && c.window !== "none") {
        field = `${c.field}_${c.window}`;
      }

      // Map synthetic player.* fields to underlying metric names
      if (c.field === "player.depositCount24h") {
        field = "deposit_count_24h";
      } else if (c.field === "player.withdrawalCount24h") {
        field = "withdrawal_count_24h";
      } else if (c.field === "player.betCount24h") {
        field = "bet_count_24h";
      } else if (c.field === "player.deviceCount") {
        field = "player.deviceCount";
      }

      const numericOps = new Set<
        (typeof OPERATORS)[number]
      >(["greater_than", "less_than", "greater_or_equals", "less_or_equals"]);

      const numericValue =
        field === "amount" || numericOps.has(c.operator)
          ? Number(c.value)
          : (c.value as any);

      return {
        field,
        operator: c.operator,
        value: numericValue,
      };
    };

    if (editingRuleId) {
      // Update existing rule
      const existing = rules.find((r) => r.id === editingRuleId);
      if (existing) {
        updateRule(editingRuleId, {
          name: name.trim(),
          description: description.trim() || undefined,
          enabled,
          domain,
          group: (group || "manual_review") as Rule["group"],
          severity,
          eventType: eventType === "any" ? "any" : eventType,
          conditions: conditions.map(mapConditionToRule),
          actions: actionsPayload as unknown as Rule["actions"],
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
        domain,
        group: (group || "manual_review") as Rule["group"],
        severity,
        eventType: eventType === "any" ? "any" : eventType,
        conditions: conditions.map(mapConditionToRule),
        actions: actionsPayload as unknown as Rule["actions"],
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
    setDomain(
      (rule.domain as (typeof DOMAIN_OPTIONS)[number]) ?? "operations",
    );
    setGroup(rule.group ?? "");

    // UI only supports flat conditions; if conditions are a nested group, we ignore them here.
    const flatConditions = Array.isArray(rule.conditions)
      ? rule.conditions
      : [];
    setConditions(
      flatConditions.map((c) => {
        const originalField = String(c.field);
        let baseField = originalField as (typeof CONDITION_FIELDS)[number];
        let window: string | undefined;

        // If this is a windowed metric (e.g. deposit_count_10m), split into
        // base metric + window suffix for the UI.
        const metricMatch = originalField.match(
          /^(deposit_count|withdrawal_count|bet_count|login_count|casino_session_count)_(5m|10m|30m|1h|24h)$/,
        );
        if (metricMatch) {
          baseField = metricMatch[1] as (typeof CONDITION_FIELDS)[number];
          window = metricMatch[2];
        }

        return {
          field: baseField,
          operator: c.operator as (typeof OPERATORS)[number],
          value: String(c.value ?? ""),
          window: window ?? "none",
        };
      }),
    );

    setSeverity((rule.severity as any) ?? "medium");

    // Map stored RuleAction union (camelCase + value) back into UI actions (snake_case + params)
    const uiActions =
      (rule.actions as Rule["actions"] | undefined)?.map((a) => {
        switch (a.type) {
          case "createAlert":
            return { type: "create_alert", params: {} as Record<string, unknown> };
          case "createCase":
            return { type: "create_case", params: {} as Record<string, unknown> };
          case "assignSegment":
            return {
              type: "assign_segment",
              params: { segment: (a as any).value ?? "" },
            };
          case "blockWithdrawal":
            return { type: "block_withdrawal", params: {} };
          case "blockDeposit":
            return { type: "block_deposit", params: {} };
          case "blockBet":
            return { type: "block_bet", params: {} };
          case "blockBonus":
            return { type: "block_bonus", params: {} };
          case "blockGameplay":
            return { type: "block_gameplay", params: {} };
          case "requireKyc":
            return { type: "require_kyc", params: {} };
          case "freezeAccount":
            return { type: "freeze_account", params: {} };
          case "closeAccount":
            return { type: "close_account", params: {} };
          case "limitStake":
            return {
              type: "limit_stake",
              params: { amount: (a as any).value ?? "" },
            };
          case "moveCddTier":
            return {
              type: "move_cdd_tier",
              params: { tier: (a as any).value ?? "" },
            };
          default:
            return { type: (a as any).type as string, params: {} as Record<string, unknown> };
        }
      }) ?? [];

    setActions(uiActions);

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

      {/* Domain filter tabs & Group filter dropdown */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "sportsbook_trading", label: "Sportsbook" },
            { id: "fraud_abuse", label: "Fraud" },
            { id: "aml_compliance", label: "AML" },
            { id: "operations", label: "Operations" },
            { id: "responsible_gambling", label: "RG" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setDomainFilter(tab.id as "all" | (typeof DOMAIN_OPTIONS)[number])
              }
              className={`rounded-full px-3 py-1 ${
                domainFilter === tab.id
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/60"
                  : "border border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Group</span>
          <select
            value={groupFilter}
            onChange={(e) =>
              setGroupFilter(e.target.value)
            }
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
          >
            <option value="all">All Groups</option>
            {availableGroupsForFilter.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/40">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-slate-200">
          <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Rule Name</th>
              <th className="px-3 py-2.5 font-semibold">Domain</th>
              <th className="px-3 py-2.5 font-semibold">Group</th>
              <th className="px-3 py-2.5 font-semibold">Type</th>
              <th className="px-3 py-2.5 font-semibold">Event</th>
              <th className="px-3 py-2.5 font-semibold">Enabled</th>
              <th className="px-3 py-2.5 font-semibold">Actions</th>
              <th className="px-3 py-2.5 font-semibold">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {filteredRules.map((r) => (
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
                  <Badge variant="outline">
                    {(r.domain ?? "operations")
                      .replace("_", " ")
                      .replace("fraud", "Fraud")
                      .replace("aml", "AML")}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-middle">
                  <span className="text-[11px] text-slate-300">
                    {r.group ?? "manual_review"}
                  </span>
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
            {filteredRules.length === 0 && (
              <tr>
                <td
                  colSpan={8}
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
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-slate-900 p-6">
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
              {/* Taxonomy order: Domain → Group → Event Type */}
              <div className="space-y-1">
                <label className="block text-slate-300">Risk Domain</label>
                <select
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value as (typeof DOMAIN_OPTIONS)[number]);
                    setGroup("");
                    setEventType("any");
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-300">Rule Group</label>
                <select
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setEventType("any");
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                >
                  <option value="">Select group</option>
                  {availableGroupsForDomain.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
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

              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="block text-slate-300">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(
                        e.target.value as "critical" | "high" | "medium" | "low",
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  >
                    <option value="critical">critical</option>
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
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
                {conditions.map((c, idx) => {
                  const isMetricField = (
                    METRIC_BASE_FIELDS as readonly string[]
                  ).includes(c.field);

                  return (
                    <div key={idx} className="flex flex-wrap gap-2">
                      {/* Metric / field selector */}
                      <select
                        value={c.field}
                        onChange={(e) =>
                          handleConditionChange(
                            idx,
                            "field",
                            e.target.value as (typeof CONDITION_FIELDS)[number],
                          )
                        }
                        className="w-40 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                      >
                        <optgroup label="Event Fields">
                          <option value="event.amount">event.amount</option>
                          <option value="event.country">event.country</option>
                          <option value="event.ip">event.ip</option>
                          <option value="event.device">event.device</option>
                          <option value="event.timestamp">event.timestamp</option>
                        </optgroup>
                        <optgroup label="Event Context">
                          <option value="event.product">event.product</option>
                          <option value="event.sport">event.sport</option>
                          <option value="event.marketType">event.marketType</option>
                          <option value="event.betType">event.betType</option>
                          <option value="event.gameType">event.gameType</option>
                          <option value="event.provider">event.provider</option>
                        </optgroup>
                        <optgroup label="Player Metrics">
                          <option value="player.depositCount24h">
                            player.depositCount
                          </option>
                          <option value="player.withdrawalCount24h">
                            player.withdrawalCount
                          </option>
                          <option value="player.betCount24h">
                            player.betCount
                          </option>
                          <option value="player.deviceCount">
                            player.deviceCount
                          </option>
                          <option value="player.sessionCount">
                            player.sessionCount
                          </option>
                        </optgroup>
                        <optgroup label="Advanced Metrics">
                          {CONDITION_FIELDS.filter(
                            (f) =>
                              ![
                                "event.amount",
                                "event.country",
                                "event.ip",
                                "event.device",
                                "event.timestamp",
                                "player.depositCount24h",
                                "player.withdrawalCount24h",
                                "player.betCount24h",
                                "player.deviceCount",
                                "player.sessionCount",
                              ].includes(f),
                          ).map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      {/* Operator selector, displayed as symbolic operators */}
                      <select
                        value={c.operator}
                        onChange={(e) =>
                          handleConditionChange(
                            idx,
                            "operator",
                            e.target.value as (typeof OPERATORS)[number],
                          )
                        }
                        className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                      >
                        {OPERATORS.map((o) => (
                          <option key={o} value={o}>
                            {OPERATOR_LABELS[o]}
                          </option>
                        ))}
                      </select>

                      {/* Numeric value */}
                      <input
                        value={c.value}
                        onChange={(e) =>
                          handleConditionChange(idx, "value", e.target.value)
                        }
                        className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                        placeholder="Value"
                      />

                      {/* Time window selector for metric-based fields */}
                      {isMetricField && (
                        <select
                          value={c.window ?? "none"}
                          onChange={(e) =>
                            handleConditionChange(idx, "window", e.target.value)
                          }
                          className="w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                        >
                          {TIME_WINDOWS.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-slate-200">Actions</span>
                  <button
                    type="button"
                    className="text-[11px] text-emerald-300 hover:underline"
                    onClick={() =>
                      setActions((prev) => [
                        ...prev,
                        { type: "create_alert", params: {} },
                      ])
                    }
                  >
                    + Add Action
                  </button>
                </div>

                {actions.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    No actions configured. Rule will only log matches.
                  </p>
                )}

                <div className="space-y-2 text-[11px]">
                  {actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-2 py-1"
                    >
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          setActions((prev) =>
                            prev.map((a, i) =>
                              i === idx ? { type, params: {} } : a,
                            ),
                          );
                        }}
                        className="w-40 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                      >
                        <option value="create_alert">create_alert</option>
                        <option value="create_case">create_case</option>
                        <option value="assign_segment">assign_segment</option>
                        <option value="block_withdrawal">block_withdrawal</option>
                        <option value="block_deposit">block_deposit</option>
                        <option value="limit_stake">limit_stake</option>
                        <option value="block_bet">block_bet</option>
                        <option value="block_bonus">block_bonus</option>
                        <option value="block_gameplay">block_gameplay</option>
                        <option value="require_kyc">require_kyc</option>
                        <option value="freeze_account">freeze_account</option>
                        <option value="close_account">close_account</option>
                        <option value="move_cdd_tier">move_cdd_tier</option>
                      </select>

                      {action.type === "limit_stake" && (
                        <input
                          placeholder="Amount"
                          className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                          value={
                            String(
                              (action.params as Record<string, unknown>).amount ??
                                "",
                            )
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setActions((prev) =>
                              prev.map((a, i) =>
                                i === idx
                                  ? {
                                      ...a,
                                      params: { ...(a.params ?? {}), amount: value },
                                    }
                                  : a,
                              ),
                            );
                          }}
                        />
                      )}

                      {action.type === "move_cdd_tier" && (
                        <input
                          placeholder="Tier"
                          className="w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                          value={
                            String(
                              (action.params as Record<string, unknown>).tier ??
                                "",
                            )
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setActions((prev) =>
                              prev.map((a, i) =>
                                i === idx
                                  ? {
                                      ...a,
                                      params: { ...(a.params ?? {}), tier: value },
                                    }
                                  : a,
                              ),
                            );
                          }}
                        />
                      )}

                      <button
                        type="button"
                        className="ml-auto rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                        onClick={() =>
                          setActions((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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

