import React, { useState, useEffect } from "react";
import {
  getMembers,
  getMemberLoans,
  getProducts,
  distributePayment,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";

function PaymentDistributionPage() {
  const [members, setMembers] = useState([]);
  const [savingsProducts, setSavingsProducts] = useState([]);
  const [memberLoans, setMemberLoans] = useState([]);
  const [savingsAmounts, setSavingsAmounts] = useState({}); // { [product_id]: amount }
  const [formData, setFormData] = useState({
    member_id: "",
    date: new Date().toISOString().slice(0, 10),
    loan_id: "",
    loan_repayment: "",
    card: "",
    reg_fee: "",
    notes: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMembers().then((res) => setMembers(res.data));
    getProducts().then((res) => {
      setSavingsProducts(res.data.filter((p) => p.category === "savings"));
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "member_id" && value) {
      getMemberLoans(value).then((res) =>
        setMemberLoans(res.data.filter((l) => l.status === "active")),
      );
    }
  };

  const handleSavingsChange = (productId, value) => {
    setSavingsAmounts({ ...savingsAmounts, [productId]: value });
  };

  const savingsTotal = Object.values(savingsAmounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );
  const totalDistributed =
    savingsTotal +
    (parseFloat(formData.loan_repayment) || 0) +
    (parseFloat(formData.card) || 0) +
    (parseFloat(formData.reg_fee) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await distributePayment({ ...formData, savings: savingsAmounts });
      setMessage("Payment recorded successfully.");
      setFormData({
        member_id: "",
        date: new Date().toISOString().slice(0, 10),
        loan_id: "",
        loan_repayment: "",
        card: "",
        reg_fee: "",
        notes: "",
      });
      setSavingsAmounts({});
      setMemberLoans([]);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to record payment");
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Payment Distribution Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            name="member_id"
            value={formData.member_id}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">
            Savings Products
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {savingsProducts.map((p) => (
              <div key={p.id}>
                <label className="text-xs text-gray-500">{p.name}</label>
                <input
                  type="number"
                  step="0.01"
                  value={savingsAmounts[p.id] || ""}
                  onChange={(e) => handleSavingsChange(p.id, e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">Other</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500">Loan Repayment</label>
              <input
                type="number"
                step="0.01"
                name="loan_repayment"
                value={formData.loan_repayment}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Card</label>
              <input
                type="number"
                step="0.01"
                name="card"
                value={formData.card}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Reg Fee</label>
              <input
                type="number"
                step="0.01"
                name="reg_fee"
                value={formData.reg_fee}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {parseFloat(formData.loan_repayment) > 0 && (
          <select
            name="loan_id"
            value={formData.loan_id}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">
              Select which loan this repayment applies to
            </option>
            {memberLoans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.product_name || "Loan"} — outstanding ₦
                {parseFloat(l.outstanding_balance).toLocaleString()}
              </option>
            ))}
          </select>
        )}

        <input
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
          className={inputClass}
        />

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Total distributed:{" "}
            <span className="font-bold text-primary-700">
              ₦{totalDistributed.toLocaleString()}
            </span>
          </p>
          <Button type="submit">Record Payment</Button>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
    </Card>
  );
}

export default PaymentDistributionPage;
