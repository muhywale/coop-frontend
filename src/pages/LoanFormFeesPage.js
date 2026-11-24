import React, { useState, useEffect } from "react";
import { getLoanFormFees, saveLoanFormFees } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm";

function LoanFormFeesPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [loanTypes, setLoanTypes] = useState([]);
  const [amounts, setAmounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getLoanFormFees()
      .then((res) => {
        setProducts(res.data.products);
        setProductId(
          res.data.form_fee_product_id
            ? String(res.data.form_fee_product_id)
            : "",
        );
        setLoanTypes(res.data.loan_products);
        const start = {};
        res.data.loan_products.forEach((p) => {
          start[p.id] = p.amount || "";
        });
        setAmounts(start);
      })
      .catch(() =>
        setMessage({ text: "Couldn't load the form amounts.", ok: false }),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveLoanFormFees({
        form_fee_product_id: productId || null,
        fees: loanTypes.map((p) => ({
          loan_product_id: p.id,
          amount: amounts[p.id],
        })),
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Loan Form Amounts</h2>

      <Card>
        <p className="text-sm text-gray-500 mb-4">
          The form amount is an expected payment: it appears on the Payment
          Schedule when a loan is issued, and the member pays it through Record
          Payment. It counts as income only then. On the Products page, add a
          product called <strong>Loan Form</strong>, linked to your form-fee
          income account. Don't tick Compulsory on it.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          It's collected through a payment line of its own and counted as
          income. On the Products page, add a product called{" "}
          <strong>Loan Form</strong>, linked to your form-fee income account.
          Don't tick Compulsory on it.
        </p>
        <div className="max-w-sm">
          <label className="text-xs text-gray-500">
            Loan form payment line
          </label>
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
      </Card>

      <Card>
        <h3 className="font-semibold mb-1">Amount for each loan type</h3>
        <p className="text-sm text-gray-500 mb-4">
          Filled in automatically when you issue a loan of that type. You can
          still change or waive it for one member. Leave blank for no form
          amount.
        </p>
        {loanTypes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No loan types yet. Add them on the Products page first.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {loanTypes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={amounts[p.id]}
                    onChange={(e) =>
                      setAmounts({ ...amounts, [p.id]: e.target.value })
                    }
                    onWheel={(e) => e.target.blur()}
                    className="w-36 border border-gray-300 rounded-md px-3 py-2 text-sm text-right"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
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

export default LoanFormFeesPage;
