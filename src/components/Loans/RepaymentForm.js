import React, { useState } from "react";
import { recordRepayment } from "../../api/api";
import Button from "../ui/Button";

function RepaymentForm({ loanId, onRepaymentAdded }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await recordRepayment(loanId, { amount: parseFloat(amount) });
    setAmount("");
    setSubmitting(false);
    onRepaymentAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <input
        type="number"
        step="0.01"
        placeholder="Repayment amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Record Repayment"}
      </Button>
    </form>
  );
}

export default RepaymentForm;
