import React, { useState, useEffect } from "react";
import { getMemberDues, saveMemberDues } from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "border border-gray-300 rounded-md px-3 py-2";
const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const per = (frequency) => (frequency === "weekly" ? "week" : "month");
const nextMonthValue = () => {
  const d = new Date();
  return toLocalDateString(
    new Date(d.getFullYear(), d.getMonth() + 1, 1),
  ).slice(0, 7);
};

function MemberDuesPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [data, setData] = useState(null);
  const [edits, setEdits] = useState({});
  const [month, setMonth] = useState(nextMonthValue());
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberDues()
      .then((res) => {
        setProducts(res.data.products);
        if (res.data.products.length > 0)
          setProductId(String(res.data.products[0].id));
      })
      .catch(() =>
        setMessage({ text: "Couldn't load the accounts.", ok: false }),
      )
      .finally(() => setLoading(false));
  }, []);

  const loadMembers = (id) =>
    getMemberDues(id)
      .then((res) => setData(res.data))
      .catch(() =>
        setMessage({ text: "Couldn't load the members.", ok: false }),
      );

  useEffect(() => {
    if (!productId) return;
    setData(null);
    setEdits({});
    loadMembers(productId);
  }, [productId]);

  const changed = data
    ? data.members.filter((m) => {
        const v = edits[m.id];
        if (v === undefined || v === "") return false;
        const n = parseFloat(v);
        return Number.isFinite(n) && n >= 0 && Math.abs(n - m.amount) > 0.004;
      })
    : [];

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveMemberDues({
        product_id: Number(productId),
        effective_from: `${month}-01`,
        entries: changed.map((m) => ({
          member_id: m.id,
          amount: parseFloat(edits[m.id]),
        })),
      });
      setMessage({ text: res.data.message, ok: true });
      setEdits({});
      loadMembers(productId);
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

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Contribution Amounts</h2>
        <p className="text-gray-500">
          No compulsory accounts yet. On the Products page, tick "Compulsory
          due" on a savings product and set its standard amount first.
        </p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const visible = data
    ? data.members.filter(
        (m) =>
          !q ||
          m.full_name.toLowerCase().includes(q) ||
          (m.member_number || "").toLowerCase().includes(q),
      )
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Contribution Amounts</h2>

      <Card>
        <p className="text-sm text-gray-500 mb-4">
          Set a different amount for individual members. Anyone you don't change
          keeps the standard amount. A new amount starts from the month you
          choose, and earlier months keep what was expected then.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-gray-500 block">Account</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`${inputClass} min-w-[220px]`}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block">
              Changes start from
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={inputClass}
            />
          </div>
          {data?.product && (
            <p className="text-sm text-gray-600 pb-2">
              Standard:{" "}
              <span className="font-medium">
                {money(data.product.standard_amount)}
              </span>{" "}
              a {per(data.product.frequency)}
            </p>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
        <Button onClick={save} disabled={saving || changed.length === 0}>
          {saving ? "Saving..." : `Save ${changed.length} change(s)`}
        </Button>
      </div>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}

      {!data ? (
        <p className="text-gray-500">Loading members...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[65vh]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="py-2 px-4">Member</th>
                <th className="py-2 px-4 text-right">Pays now</th>
                <th className="py-2 px-4 text-right">New amount</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-1.5 px-4">
                    {m.member_number ? `${m.member_number} — ` : ""}
                    {m.full_name}
                    {m.custom && (
                      <span className="ml-2 text-[10px] uppercase bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                        Own amount
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-4 text-right whitespace-nowrap">
                    {money(m.amount)}
                  </td>
                  <td className="py-1.5 px-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={edits[m.id] ?? ""}
                      onChange={(e) =>
                        setEdits({ ...edits, [m.id]: e.target.value })
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder="unchanged"
                      className="w-32 border border-gray-300 rounded px-2 py-1 text-right text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MemberDuesPage;
