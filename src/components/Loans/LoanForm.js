import React, { useState, useEffect } from "react";
import { createLoan, getProducts, getMembers } from "../../api/api";
import Card from "../ui/Card";
import Button from "../ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

function LoanForm({ onLoanAdded }) {
  const [formData, setFormData] = useState({
    member_id: "",
    principal: "",
    product_id: "",
  });
  const [loanProducts, setLoanProducts] = useState([]);
  const [members, setMembers] = useState([]);
  useEffect(() => {
    getProducts().then((res) => {
      setLoanProducts(res.data.filter((p) => p.category === "loan"));
    });
    getMembers().then((res) => {
      setMembers(res.data);
    });
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await createLoan(formData);
    onLoanAdded(response.data);
    setFormData({ member_id: "", principal: "", product_id: "" });
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Issue Loan</h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
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
              {m.member_number ? `${m.member_number} — ` : ""}
              {m.full_name}
            </option>
          ))}
        </select>

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
              {p.interest_type === "reducing_balance" ? "reducing" : "one-off"})
            </option>
          ))}
        </select>
        <Button type="submit" className="sm:col-span-3 w-fit">
          Issue Loan
        </Button>
      </form>
    </Card>
  );
}

export default LoanForm;
