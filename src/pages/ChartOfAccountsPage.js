import React, { useState, useEffect } from "react";
import {
  getChartOfAccounts,
  createAccount,
  deactivateAccount,
  reactivateAccount,
  deleteAccount,
} from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    account_type: "asset",
    normal_balance: "debit",
  });
  const [message, setMessage] = useState(null);

  const fetchAccounts = () =>
    getChartOfAccounts(showInactive).then((res) => setAccounts(res.data));
  useEffect(() => {
    fetchAccounts();
  }, [showInactive]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "account_type") {
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
    setMessage(null);
    try {
      await createAccount(formData);
      setMessage({ text: `Account "${formData.name}" created.`, ok: true });
      setFormData({
        code: "",
        name: "",
        account_type: "asset",
        normal_balance: "debit",
      });
      fetchAccounts();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to create account",
        ok: false,
      });
    }
  };

  const handleDeactivate = async (id) => {
    if (
      !window.confirm(
        "Deactivate this account? It will be hidden but its history stays intact.",
      )
    )
      return;
    await deactivateAccount(id);
    fetchAccounts();
  };

  const handleReactivate = async (id) => {
    await reactivateAccount(id);
    fetchAccounts();
  };

  const handleDelete = async (account) => {
    if (
      !window.confirm(
        `Permanently delete "${account.name}"? This only works if it has no transaction history.`,
      )
    )
      return;
    try {
      await deleteAccount(account.id);
      setMessage({ text: `"${account.name}" deleted.`, ok: true });
      fetchAccounts();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to delete account",
        ok: false,
      });
    }
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
        {message && (
          <p
            className={`text-sm mt-3 ${message.ok ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show deactivated accounts too
        </label>
      </div>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Code</th>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Type</th>
          <th className="py-3 px-6">Normal Balance</th>
          <th className="py-3 px-6">Status</th>
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
                {a.active ? (
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    Inactive
                  </span>
                )}
              </td>
              <td className="py-3 px-6">
                <div className="flex gap-2">
                  {a.active ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleDeactivate(a.id)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleReactivate(a.id)}
                    >
                      Reactivate
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => handleDelete(a)}>
                    Delete
                  </Button>
                </div>
              </td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ChartOfAccountsPage;
