import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  getMembers,
  getProducts,
  getPaymentSchedule,
  recordBulkPayments,
} from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Button from "../components/ui/Button";

const EMPTY = {};
const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) =>
  `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString();

const cellInput =
  "w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
const filterClass = "border border-gray-300 rounded-md px-3 py-2";

const GROUP_LABEL = {
  savings: "Savings",
  other: "Fees & other",
  loan: "Loan repayments",
};
const GROUP_STYLE = {
  savings: "bg-green-50 text-green-700",
  other: "bg-amber-50 text-amber-700",
  loan: "bg-red-50 text-red-700",
};
const CATEGORY_ORDER = { savings: 0, other: 1, loan: 2 };

// One member row. Memoised so typing in one row doesn't re-render the rest.
const MemberRow = memo(function MemberRow({
  member,
  rowIndex,
  columns,
  values,
  onChange,
}) {
  const rowTotal = columns.reduce((s, c) => s + num(values[c.id]), 0);

  // Enter moves down to the same column in the next row, like a spreadsheet
  const handleKeyDown = (e, colId) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = document.querySelector(
      `input[data-row="${rowIndex + 1}"][data-col="${colId}"]`,
    );
    if (next) next.focus();
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="py-1 px-3 text-sm whitespace-nowrap sticky left-0 bg-white">
        {member.member_number ? `${member.member_number} — ` : ""}
        {member.full_name}
      </td>
      {columns.map((c) => (
        <td key={c.id} className="py-1 px-2">
          <input
            type="number"
            step="0.01"
            min="0"
            disabled={!c.linked_account_id}
            data-row={rowIndex}
            data-col={c.id}
            value={values[c.id] ?? ""}
            onChange={(e) => onChange(member.id, c.id, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, c.id)}
            onWheel={(e) => e.target.blur()}
            className={cellInput}
          />
        </td>
      ))}
      <td className="py-1 px-3 text-right font-medium whitespace-nowrap">
        {rowTotal > 0 ? money(round2(rowTotal)) : "-"}
      </td>
    </tr>
  );
});

function PaymentDistributionPage() {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rowValues, setRowValues] = useState({});
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [onlyEntered, setOnlyEntered] = useState(false);
  const [fillPeriod, setFillPeriod] = useState("month");
  const [filling, setFilling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([getMembers(), getProducts()])
      .then(([memRes, prodRes]) => {
        setMembers(
          memRes.data
            .filter((m) => m.status === "active")
            .sort((a, b) => a.full_name.localeCompare(b.full_name)),
        );
        setProducts(prodRes.data);
      })
      .catch(() =>
        setMessage({ text: "Failed to load members and products", ok: false }),
      )
      .finally(() => setLoading(false));
  }, []);

  // Savings, then fees, then loan repayments; stable so memoised rows don't re-render needlessly
  const columns = useMemo(
    () =>
      products
        .filter((p) => CATEGORY_ORDER[p.category] !== undefined)
        .sort(
          (a, b) =>
            CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
            a.name.localeCompare(b.name),
        ),
    [products],
  );

  const groups = useMemo(() => {
    const result = [];
    columns.forEach((c) => {
      const last = result[result.length - 1];
      if (last && last.category === c.category) last.count++;
      else result.push({ category: c.category, count: 1 });
    });
    return result;
  }, [columns]);

  const updateCell = useCallback((memberId, productId, value) => {
    setRowValues((prev) => ({
      ...prev,
      [memberId]: { ...(prev[memberId] || {}), [productId]: value },
    }));
  }, []);

  const hasEntry = (memberId) =>
    columns.some((c) => num(rowValues[memberId]?.[c.id]) > 0);

  const columnTotals = useMemo(() => {
    const totals = {};
    columns.forEach((c) => {
      totals[c.id] = 0;
    });
    Object.values(rowValues).forEach((row) => {
      columns.forEach((c) => {
        totals[c.id] += num(row[c.id]);
      });
    });
    return totals;
  }, [rowValues, columns]);

  const grandTotal = round2(
    Object.values(columnTotals).reduce((s, v) => s + v, 0),
  );
  const enteredCount = members.filter((m) => hasEntry(m.id)).length;

  // Pre-fill what is still owed for the week/month containing the chosen date
  const handleFill = async () => {
    setFilling(true);
    setMessage(null);
    try {
      const res = await getPaymentSchedule(fillPeriod, date);
      const next = { ...rowValues };
      let filled = 0;

      res.data.rows.forEach((r) => {
        const memberVals = { ...(next[r.member_id] || {}) };
        let changed = false;
        res.data.columns.forEach((c) => {
          const item = r.items[c.key];
          if (!item) return;
          const remaining = round2(item.expected - item.paid);
          if (remaining <= 0) return;
          const productId = Number(c.key.split("_")[1]);
          const col = columns.find((x) => x.id === productId);
          if (!col || !col.linked_account_id) return;
          if (num(memberVals[productId]) === 0) {
            memberVals[productId] = String(remaining);
            changed = true;
            filled++;
          }
        });
        if (changed) next[r.member_id] = memberVals;
      });

      setRowValues(next);
      setMessage({
        text: `Filled ${filled} amount(s) still owed for the ${fillPeriod === "week" ? "week" : "month"} of ${fmtDate(date)}. Check and adjust before saving.`,
        ok: true,
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Could not load the schedule",
        ok: false,
      });
    } finally {
      setFilling(false);
    }
  };

  const handleSave = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      alert("Choose a valid date");
      return;
    }

    const entries = [];
    members.forEach((m) => {
      const amounts = {};
      columns.forEach((c) => {
        const v = num(rowValues[m.id]?.[c.id]);
        if (v > 0) amounts[c.id] = v;
      });
      if (Object.keys(amounts).length > 0)
        entries.push({ member_id: m.id, amounts });
    });
    if (entries.length === 0) {
      alert("Enter at least one amount first");
      return;
    }

    if (
      !window.confirm(
        `Record payments for ${entries.length} member(s) totalling ${money(grandTotal)}, dated ${fmtDate(date)}?`,
      )
    )
      return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await recordBulkPayments({ date, notes, entries });
      const savedIds = new Set(res.data.saved_member_ids);

      // Clear saved rows so a second click can't post them twice; failed rows stay for fixing
      setRowValues((prev) => {
        const next = { ...prev };
        savedIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      const skipped = res.data.skipped || [];
      setMessage({ text: res.data.message, ok: skipped.length === 0, skipped });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to record payments",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const q = search.trim().toLowerCase();
  const visibleMembers = members.filter((m) => {
    if (
      q &&
      !(
        m.full_name.toLowerCase().includes(q) ||
        (m.member_number || "").toLowerCase().includes(q)
      )
    )
      return false;
    if (onlyEntered && !hasEntry(m.id)) return false;
    return true;
  });

  const saveButton = (
    <Button onClick={handleSave} disabled={saving || enteredCount === 0}>
      {saving
        ? "Recording..."
        : `Record ${enteredCount} member(s) · ${money(grandTotal)}`}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Record Payments</h2>
        {saveButton}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 block">Payment date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={filterClass}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 block">
            Note (optional, applies to savings and fees)
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${filterClass} w-full`}
          />
        </div>
        <div className="flex items-end gap-2">
          <select
            value={fillPeriod}
            onChange={(e) => setFillPeriod(e.target.value)}
            className={filterClass}
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <Button variant="secondary" onClick={handleFill} disabled={filling}>
            {filling ? "Filling..." : "Fill expected from schedule"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${filterClass} flex-1 min-w-[200px]`}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyEntered}
            onChange={(e) => setOnlyEntered(e.target.checked)}
          />
          Show only members with amounts
        </label>
        <span className="text-xs text-gray-500">
          {visibleMembers.length} of {members.length} members
        </span>
      </div>

      {message && (
        <div
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          <p>{message.text}</p>
          {message.skipped?.length > 0 && (
            <ul className="list-disc pl-5 mt-1">
              {message.skipped.map((s, i) => (
                <li key={i}>
                  <strong>{s.member}</strong>: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[68vh]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-gray-50 sticky left-0" />
              {groups.map((g) => (
                <th
                  key={g.category}
                  colSpan={g.count}
                  className={`py-1 px-2 text-xs font-semibold uppercase text-center ${GROUP_STYLE[g.category]}`}
                >
                  {GROUP_LABEL[g.category]}
                </th>
              ))}
              <th className="bg-gray-50" />
            </tr>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <th className="py-2 px-3 sticky left-0 bg-gray-50">Member</th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="py-2 px-2 whitespace-nowrap text-right"
                >
                  {c.name}
                  {!c.linked_account_id && (
                    <span
                      className="ml-1 text-red-500"
                      title="Not linked to a ledger account — link it on the Products page first"
                    >
                      ⚠
                    </span>
                  )}
                </th>
              ))}
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((m, i) => (
              <MemberRow
                key={m.id}
                member={m}
                rowIndex={i}
                columns={columns}
                values={rowValues[m.id] || EMPTY}
                onChange={updateCell}
              />
            ))}
          </tbody>
          <tfoot className="sticky bottom-0">
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <td className="py-2 px-3 sticky left-0 bg-gray-100">
                Column total
              </td>
              {columns.map((c) => (
                <td
                  key={c.id}
                  className="py-2 px-2 text-right whitespace-nowrap"
                >
                  {columnTotals[c.id] > 0
                    ? money(round2(columnTotals[c.id]))
                    : "-"}
                </td>
              ))}
              <td className="py-2 px-3 text-right whitespace-nowrap">
                {money(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>{saveButton}</div>
    </div>
  );
}

export default PaymentDistributionPage;
