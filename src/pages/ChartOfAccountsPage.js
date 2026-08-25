import React, { useState, useEffect } from "react";
import {
  getChartOfAccounts,
  createAccount,
  deactivateAccount,
} from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    account_type: "asset",
    normal_balance: "debit",
  });
  const [message, setMessage] = useState("");

  const fetchAccounts = () =>
    getChartOfAccounts().then((res) => setAccounts(res.data));
  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "account_type") {
      // auto-suggest normal_balance based on type
      const suggested = ["asset", "expense"].includes(value)
        ? "debit"
        : "credit";
      setFormData({
        ...formData,
        account_type: value,
        normal_balance: suggested,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await createAccount(formData);
      setMessage(`Account "${formData.name}" created.`);
      setFormData({
        code: "",
        name: "",
        account_type: "asset",
        normal_balance: "debit",
      });
      fetchAccounts();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create account");
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this account?")) return;
    await deactivateAccount(id);
    fetchAccounts();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Chart of Accounts</h2>

      <Card>
        <h3 className="font-semibold mb-4">Add New Account</h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4"
        >
          <input
            name="code"
            placeholder="Code (e.g. 1013)"
            value={formData.code}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="name"
            placeholder="Account name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            name="normal_balance"
            value={formData.normal_balance}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <Button type="submit" className="sm:col-span-4 w-fit">
            Add Account
          </Button>
        </form>
        {message && <p className="text-sm mt-3 text-primary-700">{message}</p>}
      </Card>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Code</th>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Type</th>
          <th className="py-3 px-6">Normal Balance</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {accounts.map((a) => (
            <TableRow key={a.id}>
              <td className="py-3 px-6">{a.code}</td>
              <td className="py-3 px-6 font-medium">{a.name}</td>
              <td className="py-3 px-6 capitalize text-gray-600">
                {a.account_type}
              </td>
              <td className="py-3 px-6 capitalize text-gray-600">
                {a.normal_balance}
              </td>
              <td className="py-3 px-6">
                <Button variant="danger" onClick={() => handleDeactivate(a.id)}>
                  Deactivate
                </Button>
              </td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ChartOfAccountsPage;
