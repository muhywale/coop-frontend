import React, { useState, useEffect } from "react";
import { getLoans, getProducts, editLoan } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import RepaymentForm from "./RepaymentForm";

const inputClass = "border border-gray-300 rounded-md px-2 py-1 w-full";

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoanId, setExpandedLoanId] = useState(null);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState("");

  const fetchLoans = async () => {
    const res = await getLoans();
    setLoans(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
    getProducts().then((res) =>
      setLoanProducts(res.data.filter((p) => p.category === "loan")),
    );
  }, []);

  const toggleRepaymentForm = (loanId) =>
    setExpandedLoanId(expandedLoanId === loanId ? null : loanId);

  const startEdit = (loan) => {
    setEditingLoanId(loan.id);
    setEditForm({
      principal: loan.principal,
      product_id: loan.product_id || "",
      duration_value: loan.duration_value || "",
      duration_unit: loan.duration_unit || "months",
    });
    setMessage("");
  };

  const saveEdit = async (loanId) => {
    try {
      const res = await editLoan(loanId, editForm);
      setMessage(res.data.message);
      setEditingLoanId(null);
      fetchLoans();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update loan");
    }
  };

  if (loading) return <p className="text-gray-500">Loading loans...</p>;

  return (
    <div>
      {message && (
        <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-md px-4 py-2 mb-4">
          {message}
        </p>
      )}
      <Table>
        <TableHead>
          <th className="py-3 px-6">Member</th>
          <th className="py-3 px-6">Product</th>
          <th className="py-3 px-6">Principal</th>
          <th className="py-3 px-6">Duration</th>
          <th className="py-3 px-6">Outstanding</th>
          <th className="py-3 px-6">Status</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {loans.map((loan) => (
            <React.Fragment key={loan.id}>
              {editingLoanId === loan.id ? (
                <tr className="border-b border-gray-50 bg-gray-50">
                  <td className="py-3 px-6 font-medium">{loan.full_name}</td>
                  <td className="py-3 px-6">
                    <select
                      value={editForm.product_id}
                      onChange={(e) =>
                        setEditForm({ ...editForm, product_id: e.target.value })
                      }
                      className={inputClass}
                    >
                      {loanProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.principal}
                      onChange={(e) =>
                        setEditForm({ ...editForm, principal: e.target.value })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="py-3 px-6 flex gap-1">
                    <input
                      type="number"
                      value={editForm.duration_value}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          duration_value: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. 12"
                    />
                    <select
                      value={editForm.duration_unit}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          duration_unit: e.target.value,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </td>
                  <td className="py-3 px-6 text-gray-400">—</td>
                  <td className="py-3 px-6">
                    <Badge status={loan.status} />
                  </td>
                  <td className="py-3 px-6 flex gap-2">
                    <Button onClick={() => saveEdit(loan.id)}>Save</Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingLoanId(null)}
                    >
                      Cancel
                    </Button>
                  </td>
                </tr>
              ) : (
                <TableRow>
                  <td className="py-3 px-6 font-medium">{loan.full_name}</td>
                  <td className="py-3 px-6 text-gray-600">
                    {loan.product_name}
                  </td>
                  <td className="py-3 px-6">
                    ₦{parseFloat(loan.principal).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {loan.duration_value
                      ? `${loan.duration_value} ${loan.duration_unit}`
                      : "—"}
                  </td>
                  <td className="py-3 px-6 font-medium">
                    ₦{parseFloat(loan.outstanding_balance).toLocaleString()}
                  </td>
                  <td className="py-3 px-6">
                    <Badge status={loan.status} />
                  </td>
                  <td className="py-3 px-6 flex gap-2">
                    <Button variant="secondary" onClick={() => startEdit(loan)}>
                      Edit
                    </Button>
                    {loan.status !== "paid" && (
                      <Button
                        variant="secondary"
                        onClick={() => toggleRepaymentForm(loan.id)}
                      >
                        {expandedLoanId === loan.id ? "Cancel" : "Repay"}
                      </Button>
                    )}
                  </td>
                </TableRow>
              )}
              {expandedLoanId === loan.id && (
                <tr>
                  <td colSpan="7" className="bg-gray-50 px-6 py-4">
                    <RepaymentForm
                      loanId={loan.id}
                      onRepaymentAdded={fetchLoans}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default LoanList;
