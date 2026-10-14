import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  getAccountCarryForward,
  saveAccountCarryForward,
  getMemberCarryForward,
  saveMemberCarryForward,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
const cellInput =
  "w-28 border border-gray-300 rounded px-2 py-1 text-right text-sm";
const EMPTY = {};
const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) =>
  `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// One member row. Memoised so typing in one row doesn't re-render the other ~290.
const MemberRow = memo(function MemberRow({
  member,
  products,
  values,
  onChange,
}) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-1 px-3 text-sm whitespace-nowrap sticky left-0 bg-white">
        {member.member_number ? `${member.member_number} — ` : ""}
        {member.full_name}
      </td>
      {products.map((p) => (
        <td key={p.id} className="py-1 px-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={values[p.id] ?? ""}
            onChange={(e) => onChange(member.id, p.id, e.target.value)}
            className={cellInput}
          />
        </td>
      ))}
    </tr>
  );
});

function CarryForwardPage() {
  const [tab, setTab] = useState("accounts");
  const [asAt, setAsAt] = useState("");
  const [accountsAsAt, setAccountsAsAt] = useState(null);
  const [membersAsAt, setMembersAsAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [accountRows, setAccountRows] = useState([]);
  const [entryCount, setEntryCount] = useState(0);

  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rowValues, setRowValues] = useState({});
  const [originalRows, setOriginalRows] = useState({});
  const [search, setSearch] = useState("");

  const loadAccounts = useCallback(async () => {
    const res = await getAccountCarryForward();
    setAccountRows(
      res.data.accounts.map((a) => ({
        ...a,
        debit: a.debit ? String(a.debit) : "",
        credit: a.credit ? String(a.credit) : "",
      })),
    );
    setEntryCount(res.data.entryCount);
    setAccountsAsAt(res.data.asAt);
    return res.data.asAt;
  }, []);

  const loadMembers = useCallback(async () => {
    const res = await getMemberCarryForward();
    const values = {};
    res.data.cells.forEach((c) => {
      if (!values[c.member_id]) values[c.member_id] = {};
      values[c.member_id][c.product_id] = String(c.amount);
    });
    setMembers(res.data.members);
    setProducts(res.data.products);
    setRowValues(values);
    setOriginalRows(values);
    setMembersAsAt(res.data.asAt);
    return res.data.asAt;
  }, []);

  useEffect(() => {
    Promise.all([loadAccounts(), loadMembers()])
      .then(([a, m]) =>
        setAsAt(a || m || `${new Date().getFullYear() - 1}-12-31`),
      )
      .catch(() =>
        setMessage({ text: "Failed to load carry forward data", ok: false }),
      )
      .finally(() => setLoading(false));
  }, [loadAccounts, loadMembers]);

  const updateAccount = (id, field, value) =>
    setAccountRows((rows) =>
      rows.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );

  const updateCell = useCallback((memberId, productId, value) => {
    setRowValues((prev) => ({
      ...prev,
      [memberId]: { ...(prev[memberId] || {}), [productId]: value },
    }));
  }, []);

  // ----- totals -----
  const accountTotals = useMemo(() => {
    const debit = round2(accountRows.reduce((s, a) => s + num(a.debit), 0));
    const credit = round2(accountRows.reduce((s, a) => s + num(a.credit), 0));
    return { debit, credit, diff: round2(debit - credit) };
  }, [accountRows]);
  const balanced =
    accountTotals.debit > 0 && Math.abs(accountTotals.diff) < 0.005;

  const productTotals = useMemo(() => {
    const totals = {};
    products.forEach((p) => {
      totals[p.id] = 0;
    });
    Object.values(rowValues).forEach((row) => {
      products.forEach((p) => {
        totals[p.id] += num(row[p.id]);
      });
    });
    return totals;
  }, [rowValues, products]);

  const changedCells = useMemo(() => {
    const cells = [];
    members.forEach((m) => {
      products.forEach((p) => {
        const now = num(rowValues[m.id]?.[p.id]);
        const was = num(originalRows[m.id]?.[p.id]);
        if (Math.abs(now - was) > 0.0049)
          cells.push({ member_id: m.id, product_id: p.id, amount: now });
      });
    });
    return cells;
  }, [members, products, rowValues, originalRows]);

  const reconciliation = useMemo(() => {
    const accById = {};
    accountRows.forEach((a) => {
      accById[a.id] = a;
    });
    const memberSums = {};
    products.forEach((p) => {
      if (!p.linked_account_id) return;
      memberSums[p.linked_account_id] =
        (memberSums[p.linked_account_id] || 0) + (productTotals[p.id] || 0);
    });
    return Object.keys(memberSums).map((id) => {
      const acc = accById[id];
      const society = acc
        ? acc.normal_balance === "debit"
          ? num(acc.debit) - num(acc.credit)
          : num(acc.credit) - num(acc.debit)
        : 0;
      const memberTotal = round2(memberSums[id]);
      return {
        id,
        code: acc?.code || "?",
        name: acc?.name || "(account not found)",
        society: round2(society),
        memberTotal,
        diff: round2(society - memberTotal),
      };
    });
  }, [accountRows, products, productTotals]);

  // ----- saving -----
  const handleSaveAccounts = async () => {
    if (!asAt) {
      alert("Choose the 'as at' date first");
      return;
    }
    if (!balanced) {
      alert("Debits and credits must balance before saving");
      return;
    }
    if (
      !window.confirm(
        `Save these as the account carry forward as at ${asAt}? This replaces the current one in every report.`,
      )
    )
      return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveAccountCarryForward({
        as_at: asAt,
        lines: accountRows.map((a) => ({
          account_id: a.id,
          debit: num(a.debit),
          credit: num(a.credit),
        })),
      });
      setMessage({ text: res.data.message, ok: true });
      await loadAccounts();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to save",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMembers = async () => {
    if (!asAt) {
      alert("Choose the 'as at' date first");
      return;
    }
    if (
      !window.confirm(
        `Save ${changedCells.length} change(s) to member carry-forward balances as at ${asAt}?`,
      )
    )
      return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveMemberCarryForward({
        as_at: asAt,
        cells: changedCells,
      });
      const skipped = res.data.skipped || [];
      setMessage({
        text: `${res.data.message}${skipped.length ? ` — ${skipped.length} skipped: ${skipped.map((s) => `${s.cell} (${s.reason})`).join("; ")}` : ""}`,
        ok: skipped.length === 0,
      });
      await loadMembers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to save",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading carry forward...</p>;

  const q = search.trim().toLowerCase();
  const visibleMembers = members.filter(
    (m) =>
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      (m.member_number || "").toLowerCase().includes(q),
  );
  const datesDiffer =
    accountsAsAt && membersAsAt && accountsAsAt !== membersAsAt;
  const membersNeedRedate = membersAsAt && asAt !== membersAsAt;

  const tabClass = (key) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === key
        ? "border-primary-500 text-primary-700"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Carry Forward</h2>
        <div>
          <label className="text-xs text-gray-500 block">
            Carry forward as at
          </label>
          <input
            type="date"
            value={asAt}
            onChange={(e) => setAsAt(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}
      {datesDiffer && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
          Account balances are dated {accountsAsAt} but member balances are
          dated {membersAsAt}. If you change the date, save both tabs.
        </p>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("accounts")}
          className={tabClass("accounts")}
        >
          Account balances
        </button>
        <button
          onClick={() => setTab("members")}
          className={tabClass("members")}
        >
          Member balances
        </button>
        <button onClick={() => setTab("check")} className={tabClass("check")}>
          Check
        </button>
      </div>

      {tab === "accounts" && (
        <Card>
          <p className="text-xs text-gray-500 mb-3">
            Closing balance of every account at year-end. Debits must equal
            credits. Saving replaces the existing carry forward.
          </p>
          {entryCount > 1 && (
            <p className="text-sm text-amber-700 mb-3">
              {entryCount} separate opening entries were found. Saving merges
              them into one.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Account</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Debit</th>
                  <th className="py-2 px-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accountRows.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-1 px-3">{a.code}</td>
                    <td className="py-1 px-3 font-medium">
                      {a.name}
                      {!a.active && (
                        <span className="ml-2 text-xs text-gray-400">
                          (inactive)
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-3 capitalize text-gray-600">
                      {a.account_type}
                    </td>
                    <td className="py-1 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={a.debit}
                        onChange={(e) =>
                          updateAccount(a.id, "debit", e.target.value)
                        }
                        className={cellInput}
                      />
                    </td>
                    <td className="py-1 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={a.credit}
                        onChange={(e) =>
                          updateAccount(a.id, "credit", e.target.value)
                        }
                        className={cellInput}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="py-2 px-3" colSpan={3}>
                    Total
                  </td>
                  <td className="py-2 px-3 text-right">
                    {money(accountTotals.debit)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {money(accountTotals.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={handleSaveAccounts} disabled={saving || !balanced}>
              {saving ? "Saving..." : "Save account balances"}
            </Button>
            <span
              className={`text-sm ${balanced ? "text-green-600" : "text-red-600"}`}
            >
              {balanced
                ? "Balanced ✓"
                : `Out by ${money(Math.abs(accountTotals.diff))}`}
            </span>
          </div>
        </Card>
      )}

      {tab === "members" && (
        <Card>
          <p className="text-xs text-gray-500 mb-3">
            Each member's balance per product at year-end (savings and loan
            products). Loan amounts are the outstanding balance carried forward.
            Clear a box to remove that balance.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              placeholder="Search by name or member number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} flex-1 min-w-[200px]`}
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {visibleMembers.length} of {members.length} members ·{" "}
              {changedCells.length} unsaved change(s)
            </span>
          </div>
          <div className="overflow-auto max-h-[65vh] border border-gray-200 rounded-md">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 px-3 sticky left-0 bg-gray-50">Member</th>
                  {products.map((p) => (
                    <th
                      key={p.id}
                      className="py-2 px-2 whitespace-nowrap text-right"
                    >
                      {p.name}
                      {p.category === "loan" && (
                        <span className="block text-[10px] normal-case text-red-500">
                          loan
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-100 text-xs font-bold border-b border-gray-200">
                  <td className="py-1 px-3 sticky left-0 bg-gray-100">
                    Column total
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="py-1 px-2 text-right whitespace-nowrap"
                    >
                      {money(round2(productTotals[p.id] || 0))}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    products={products}
                    values={rowValues[m.id] || EMPTY}
                    onChange={updateCell}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSaveMembers}
              disabled={
                saving || (changedCells.length === 0 && !membersNeedRedate)
              }
            >
              {saving
                ? "Saving..."
                : changedCells.length > 0
                  ? `Save ${changedCells.length} change(s)`
                  : "Save new date"}
            </Button>
          </div>
        </Card>
      )}

      {tab === "check" && (
        <Card>
          <p className="text-xs text-gray-500 mb-3">
            For every account linked to a product: the society-wide figure
            against the total of your members' balances. These use what is
            currently on screen, including unsaved edits, so you can fix
            differences before saving.
          </p>
          {reconciliation.length === 0 ? (
            <p className="text-sm text-gray-500">
              No products are linked to accounts yet.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 px-3">Account</th>
                  <th className="py-2 px-3 text-right">Society-wide</th>
                  <th className="py-2 px-3 text-right">Sum of members</th>
                  <th className="py-2 px-3 text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium">
                      {r.code} — {r.name}
                    </td>
                    <td className="py-2 px-3 text-right">{money(r.society)}</td>
                    <td className="py-2 px-3 text-right">
                      {money(r.memberTotal)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${Math.abs(r.diff) < 0.005 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Math.abs(r.diff) < 0.005 ? "✓ Matches" : money(r.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

export default CarryForwardPage;
