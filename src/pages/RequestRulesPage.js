import React, { useState, useEffect } from "react";
import { getRequestRules, saveRequestRules } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "border border-gray-300 rounded-md px-3 py-2";

function RequestRulesPage() {
  const [products, setProducts] = useState([]);
  const [withdrawable, setWithdrawable] = useState([]);
  const [multiple, setMultiple] = useState("");
  const [deduct, setDeduct] = useState(true);
  const [borrowIds, setBorrowIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [messages, setMessages] = useState({});

  useEffect(() => {
    getRequestRules()
      .then((res) => {
        setProducts(res.data.savings_products);
        setWithdrawable(res.data.withdrawable_product_ids);
        setMultiple(res.data.borrow_multiple ?? "");
        setDeduct(res.data.borrow_deduct_outstanding);
        setBorrowIds(res.data.borrow_product_ids);
      })
      .catch(() =>
        setMessages({ load: { text: "Couldn't load the rules.", ok: false } }),
      )
      .finally(() => setLoading(false));
  }, []);

  const toggle = (setter) => (id) =>
    setter((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  const save = async (section, payload) => {
    setSaving(section);
    setMessages({});
    try {
      await saveRequestRules(payload);
      setMessages({ [section]: { text: "Saved.", ok: true } });
    } catch (err) {
      setMessages({
        [section]: {
          text: err.response?.data?.error || "Couldn't save.",
          ok: false,
        },
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const note = (section) =>
    messages[section] && (
      <p
        className={`text-sm mt-3 ${messages[section].ok ? "text-green-600" : "text-red-600"}`}
      >
        {messages[section].text}
      </p>
    );

  const checklist = (ids, setter) =>
    products.length === 0 ? (
      <p className="text-sm text-gray-500">No savings products yet.</p>
    ) : (
      <ul className="divide-y divide-gray-100 mb-4">
        {products.map((p) => (
          <li key={p.id}>
            <label className="flex items-center gap-3 py-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={ids.includes(p.id)}
                onChange={() => toggle(setter)(p.id)}
              />
              {p.name}
            </label>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Request Rules</h2>
      {messages.load && (
        <p className="text-red-600 text-sm">{messages.load.text}</p>
      )}

      <Card>
        <h3 className="font-semibold mb-1">
          Which savings can members ask to withdraw from?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Members only see a withdrawal request for the accounts you tick.
          Shares and fixed funds are usually left unticked. Nothing is paid out
          until you approve each request.
        </p>
        {checklist(withdrawable, setWithdrawable)}
        <Button
          onClick={() =>
            save("withdrawal", { withdrawable_product_ids: withdrawable })
          }
          disabled={saving === "withdrawal"}
        >
          {saving === "withdrawal" ? "Saving..." : "Save"}
        </Button>
        {note("withdrawal")}
      </Card>

      <Card>
        <h3 className="font-semibold mb-1">Borrowing guide</h3>
        <p className="text-sm text-gray-500 mb-4">
          A guide shown to members when they apply for a loan, and to you next
          to each application. It never blocks anything: you decide each loan,
          and members can ask for more and explain why. Leave the multiple blank
          to show no guide.
        </p>

        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 block">
              Members can usually borrow up to
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                value={multiple}
                onChange={(e) => setMultiple(e.target.value)}
                placeholder="e.g. 2"
                className={`${inputClass} w-28`}
              />
              <span className="text-sm text-gray-600">× their savings</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
            <input
              type="checkbox"
              checked={deduct}
              onChange={(e) => setDeduct(e.target.checked)}
            />
            Take off loans they still owe
          </label>
        </div>

        <p className="text-sm font-medium mb-1">Savings that count toward it</p>
        <p className="text-xs text-gray-500 mb-2">
          Leave all unticked to count every savings account.
        </p>
        {checklist(borrowIds, setBorrowIds)}

        <Button
          onClick={() =>
            save("borrowing", {
              borrow_multiple: multiple,
              borrow_deduct_outstanding: deduct,
              borrow_product_ids: borrowIds,
            })
          }
          disabled={saving === "borrowing"}
        >
          {saving === "borrowing" ? "Saving..." : "Save"}
        </Button>
        {note("borrowing")}
      </Card>
    </div>
  );
}

export default RequestRulesPage;
