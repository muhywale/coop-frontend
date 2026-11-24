import React, { useState, useEffect } from "react";
import { getFineRules, saveFineRules } from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm";
const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const nextMonthValue = () => {
  const d = new Date();
  return toLocalDateString(
    new Date(d.getFullYear(), d.getMonth() + 1, 1),
  ).slice(0, 7);
};

const PERIODS = [
  { key: "month", label: "Monthly", unit: "month" },
  { key: "week", label: "Weekly", unit: "week" },
];
const GROUPS = [
  { key: "no_loan", label: "Members not on a loan" },
  { key: "on_loan", label: "Members on a loan" },
];

// What a rule would charge in an example, so the numbers can be checked before saving
const example = (rule, expected, paid) => {
  const shortfall = Math.max(expected - paid, 0);
  if (shortfall <= 0) return 0;
  const fixed = parseFloat(rule.fixed_amount) || 0;
  const percent = parseFloat(rule.percent) || 0;
  let fine = (shortfall * percent) / 100;
  if (fixed > 0 && (rule.fixed_when === "any_shortfall" || paid <= 0))
    fine += fixed;
  return fine;
};

function RuleCard({ title, unit, rule, onChange }) {
  const set = (field) => (e) => onChange({ ...rule, [field]: e.target.value });
  return (
    <Card>
      <label className="flex items-center gap-3 font-semibold mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={(e) => onChange({ ...rule, enabled: e.target.checked })}
        />
        {title}
      </label>

      {rule.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Fixed fine (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rule.fixed_amount}
                onChange={set("fixed_amount")}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Charged when they…
              </label>
              <select
                value={rule.fixed_when}
                onChange={set("fixed_when")}
                className={inputClass}
              >
                <option value="nothing_paid">paid nothing this {unit}</option>
                <option value="any_shortfall">paid less than expected</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Plus this % of the shortfall
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rule.percent}
                onChange={set("percent")}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                What counts toward the shortfall
              </label>
              <select
                value={rule.base}
                onChange={set("base")}
                className={inputClass}
              >
                <option value="all">
                  Everything due (savings, loan installment, interest)
                </option>
                <option value="savings">Savings dues only</option>
                <option value="loan">Loan installment and interest only</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Example, before rounding: expected {money(10000)}. Pays{" "}
            {money(6000)}: fine {money(example(rule, 10000, 6000))}. Pays
            nothing: fine {money(example(rule, 10000, 0))}.
          </p>
        </div>
      )}
    </Card>
  );
}

function FineRulesPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [month, setMonth] = useState(nextMonthValue());
  const [rules, setRules] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getFineRules()
      .then((res) => {
        setProducts(res.data.products);
        setProductId(
          res.data.fine_product_id ? String(res.data.fine_product_id) : "",
        );
        if (res.data.fines_start) setMonth(res.data.fines_start.slice(0, 7));
        setRules(res.data.rules);
      })
      .catch(() =>
        setMessage({ text: "Couldn't load the fine rules.", ok: false }),
      )
      .finally(() => setLoading(false));
  }, []);

  const updateRule = (period, group, next) =>
    setRules((current) => ({
      ...current,
      [period]: { ...current[period], [group]: next },
    }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveFineRules({
        fine_product_id: productId || null,
        fines_start: `${month}-01`,
        rules,
      });
      setMessage({ text: "Saved.", ok: true });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Couldn't save.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!rules) return <p className="text-red-600">{message?.text}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Fine Rules</h2>

      <Card>
        <h3 className="font-semibold mb-1">Where fines are collected</h3>
        <p className="text-sm text-gray-500 mb-4">
          Fines are collected through a payment line of their own, and count as
          income when received. On the Products page, add a product called{" "}
          <strong>Fines</strong>, linked to your fines income account. Don't
          tick Compulsory on it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Fines payment line</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.linked}>
                  {p.name}
                  {p.linked ? "" : " (no ledger account linked)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Fines start from</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Only periods that start in or after this month are fined. Earlier ones
          never are. A fine for the period that just ended appears in the next
          period's amounts due.
        </p>
      </Card>

      {PERIODS.map((period) => (
        <div key={period.key}>
          <h3 className="text-lg font-semibold mb-1">{period.label} fines</h3>
          <p className="text-sm text-gray-500 mb-3">
            Used when a member's {period.unit}ly payments fall short. Tick a box
            to switch that rule on.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {GROUPS.map((group) => (
              <RuleCard
                key={group.key}
                title={group.label}
                unit={period.unit}
                rule={rules[period.key][group.key]}
                onChange={(next) => updateRule(period.key, group.key, next)}
              />
            ))}
          </div>
        </div>
      ))}

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save fine rules"}
        </Button>
        {message && (
          <p
            className={`text-sm mt-3 ${message.ok ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default FineRulesPage;
