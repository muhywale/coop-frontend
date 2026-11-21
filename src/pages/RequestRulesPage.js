import React, { useState, useEffect } from "react";
import { getRequestRules, saveRequestRules } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "border border-gray-300 rounded-md px-3 py-2";

function RequestRulesPage() {
  const [savings, setSavings] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [withdrawable, setWithdrawable] = useState([]);
  const [rules, setRules] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [messages, setMessages] = useState({});

  useEffect(() => {
    getRequestRules()
      .then((res) => {
        setSavings(res.data.savings_products);
        setLoanProducts(res.data.loan_products);
        setWithdrawable(res.data.withdrawable_product_ids);
        const start = {};
        res.data.loan_products.forEach((p) => {
          start[p.id] = {
            multiple: p.rule?.multiple ?? "",
            savings_product_ids: p.rule?.savings_product_ids ?? [],
            deduct_mode: p.rule?.deduct_mode ?? "same",
          };
        });
        setRules(start);
      })
      .catch(() =>
        setMessages({ load: { text: "Couldn't load the rules.", ok: false } }),
      )
      .finally(() => setLoading(false));
  }, []);

  const toggleWithdrawable = (id) =>
    setWithdrawable((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  const updateRule = (loanId, patch) =>
    setRules((current) => ({
      ...current,
      [loanId]: { ...current[loanId], ...patch },
    }));

  const toggleCounted = (loanId, savingId) => {
    const ids = rules[loanId].savings_product_ids;
    updateRule(loanId, {
      savings_product_ids: ids.includes(savingId)
        ? ids.filter((x) => x !== savingId)
        : [...ids, savingId],
    });
  };

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
        {savings.length === 0 ? (
          <p className="text-sm text-gray-500">No savings products yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-4">
            {savings.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withdrawable.includes(p.id)}
                    onChange={() => toggleWithdrawable(p.id)}
                  />
                  {p.name}
                </label>
              </li>
            ))}
          </ul>
        )}
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

      <div>
        <h3 className="text-lg font-semibold mb-1">
          Borrowing guide for each loan type
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          A guide shown to members when they apply, and to you next to each
          application. It never blocks anything: you decide each loan, and
          members can ask for more and explain why. Leave the multiple blank for
          no guide on that loan type. For example: Heavy loan = 5 × Heavy Duty
          Savings, Ordinary loan = 2 × Regular Savings.
        </p>

        {loanProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No loan types yet. Add them on the Products page first.
          </p>
        ) : (
          <div className="space-y-4">
            {loanProducts.map((p) => {
              const rule = rules[p.id];
              return (
                <Card key={p.id}>
                  <h4 className="font-semibold mb-3">{p.name}</h4>

                  <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                      <label className="text-xs text-gray-500 block">
                        Can usually borrow up to
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={rule.multiple}
                          onChange={(e) =>
                            updateRule(p.id, { multiple: e.target.value })
                          }
                          placeholder="e.g. 2"
                          className={`${inputClass} w-28`}
                        />
                        <span className="text-sm text-gray-600">
                          × the savings below
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block">
                        Take off what they still owe on
                      </label>
                      <select
                        value={rule.deduct_mode}
                        onChange={(e) =>
                          updateRule(p.id, { deduct_mode: e.target.value })
                        }
                        className={inputClass}
                      >
                        <option value="same">Loans of this type</option>
                        <option value="all">All their loans</option>
                        <option value="none">Nothing</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-sm font-medium mb-1">
                    Savings that count for this loan type
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave all unticked to count every savings account.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    {savings.map((s) => (
                      <li key={s.id}>
                        <label className="flex items-center gap-3 py-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.savings_product_ids.includes(s.id)}
                            onChange={() => toggleCounted(p.id, s.id)}
                          />
                          {s.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}

            <Button
              onClick={() =>
                save("borrowing", {
                  loan_rules: loanProducts.map((p) => ({
                    loan_product_id: p.id,
                    multiple: rules[p.id].multiple,
                    savings_product_ids: rules[p.id].savings_product_ids,
                    deduct_mode: rules[p.id].deduct_mode,
                  })),
                })
              }
              disabled={saving === "borrowing"}
            >
              {saving === "borrowing" ? "Saving..." : "Save borrowing guide"}
            </Button>
            {note("borrowing")}
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestRulesPage;
