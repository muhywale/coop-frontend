import React, { useState, useEffect } from "react";
import { createLoan, getProducts } from "../../api/api";
import { toLocalDateString } from "../../utils/dateHelper";
import Card from "../ui/Card";
import Button from "../ui/Button";
import MemberSearchSelect from "../MemberSearchSelect";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

const emptyForm = () => ({
  member_id: "",
  principal: "",
  product_id: "",
  date_issued: toLocalDateString(new Date()),
  duration_value: "",
  duration_unit: "months",
});

function LoanForm({ onLoanAdded }) {
  const [formData, setFormData] = useState(emptyForm());
  const [loanProducts, setLoanProducts] = useState([]);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProducts().then((res) =>
      setLoanProducts(res.data.filter((p) => p.category === "loan")),
    );
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const response = await createLoan(formData);
      onLoanAdded(response.data);
      // Keep the date as-is so several loans from the same day can be entered quickly
      setFormData({ ...emptyForm(), date_issued: formData.date_issued });
      setMessage({ text: "Loan issued successfully.", ok: true });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to issue loan",
        ok: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Issue Loan</h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div>
          <label className="text-xs text-gray-500">Member</label>
          <MemberSearchSelect
            value={formData.member_id}
            onChange={(id) => setFormData({ ...formData, member_id: id })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Principal amount</label>
          <input
            name="principal"
            type="number"
            step="0.01"
            placeholder="Principal Amount"
            value={formData.principal}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Loan product</label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select loan product</option>
            {loanProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.interest_rate}%{" "}
                {p.interest_type === "reducing_balance"
                  ? "reducing"
                  : "one-off"}
                )
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Date issued</label>
          <input
            name="date_issued"
            type="date"
            value={formData.date_issued}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Duration</label>
          <input
            name="duration_value"
            type="number"
            placeholder="e.g. 12"
            value={formData.duration_value}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Duration unit</label>
          <select
            name="duration_unit"
            value={formData.duration_unit}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="sm:col-span-3 w-fit"
        >
          {submitting ? "Issuing..." : "Issue Loan"}
        </Button>
      </form>
      {message && (
        <p
          className={`text-sm mt-3 ${message.ok ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </Card>
  );
}

export default LoanForm;
