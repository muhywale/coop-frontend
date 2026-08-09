import React, { useState, useEffect } from "react";
import { createContribution, getProducts } from "../../api/api";
import Card from "../ui/Card";
import Button from "../ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

function ContributionForm({ onContributionAdded }) {
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    type: "savings",
    product_id: "",
    notes: "",
  });
  const [savingsProducts, setSavingsProducts] = useState([]);

  useEffect(() => {
    getProducts().then((res) => {
      setSavingsProducts(res.data.filter((p) => p.category === "savings"));
    });
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await createContribution(formData);
    onContributionAdded(response.data);
    setFormData({
      member_id: "",
      amount: "",
      type: "savings",
      product_id: "",
      notes: "",
    });
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Add Contribution</h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-5 gap-4"
      >
        <input
          name="member_id"
          placeholder="Member ID"
          value={formData.member_id}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="savings">Savings Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="registration">Registration Fee</option>
        </select>
        <select
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">Select savings product</option>
          {savingsProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className={inputClass}
        />
        <Button type="submit" className="sm:col-span-5 w-fit">
          Add Contribution
        </Button>
      </form>
    </Card>
  );
}

export default ContributionForm;
