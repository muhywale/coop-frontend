import React, { useState, useEffect } from "react";
import { getMembers, getProducts, withdrawFunds } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { toLocalDateString } from "../utils/dateHelper";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function WithdrawalPage() {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    member_id: "",
    product_id: "",
    amount: "",
    date: toLocalDateString(new Date()),
    notes: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMembers().then((res) => setMembers(res.data));
    getProducts().then((res) =>
      setProducts(res.data.filter((p) => p.category === "savings")),
    );
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await withdrawFunds(formData);
      setMessage("Withdrawal recorded successfully.");
      setFormData({
        member_id: "",
        product_id: "",
        amount: "",
        date: toLocalDateString(new Date()),
        notes: "",
      });
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to record withdrawal");
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Withdrawal</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
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
        <select
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="">Withdraw from...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
          className="sm:col-span-2"
        />
        <Button type="submit" className="sm:col-span-2 w-fit">
          Record Withdrawal
        </Button>
      </form>
      {message && <p className="text-sm mt-3 text-primary-700">{message}</p>}
    </Card>
  );
}

export default WithdrawalPage;
