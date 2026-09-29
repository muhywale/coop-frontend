import React, { useState, useEffect } from "react";
import { getLoans, getProducts, editLoan, deleteLoan } from "../../api/api";
import { toLocalDateString } from "../../utils/dateHelper";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import RepaymentForm from "./RepaymentForm";

const editInputClass = "border border-gray-300 rounded-md px-2 py-1 w-full";
const filterClass = "border border-gray-300 rounded-md px-3 py-2";

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoanId, setExpandedLoanId] = useState(null);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const handleDelete = async (loan) => {
    const ok = window.confirm(
      `Delete this ${loan.product_name || ""} loan of ₦${parseFloat(loan.principal).toLocaleString()} for ${loan.full_name}?\n\nThis removes the loan AND all its repayment records, and reverses every related ledger entry. This cannot be undone.`,
    );
    if (!ok) return;
    try {
      const res = await deleteLoan(loan.id);
      setMessage(res.data.message);
      fetchLoans();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete loan");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setProductFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
  };

  if (loading) return <p className="text-gray-500">Loading loans...</p>;

  const q = search.trim().toLowerCase();
  const filteredLoans = loans.filter((loan) => {
    if (
      q &&
      !(
        loan.full_name?.toLowerCase().includes(q) ||
        (loan.member_number || "").toLowerCase().includes(q)
      )
    )
      return false;
    if (productFilter && String(loan.product_id) !== String(productFilter))
      return false;
    if (statusFilter && loan.status !== statusFilter) return false;
    const issued = toLocalDateString(new Date(loan.date_issued));
    if (fromDate && issued < fromDate) return false;
    if (toDate && issued > toDate) return false;
    return true;
  });
  const filteredOutstanding = filteredLoans.reduce(
    (sum, l) => sum + parseFloat(l.outstanding_balance || 0),
    0,
  );

  return (
    <div>
      {message && (
        <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-md px-4 py-2 mb-4">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <input
          placeholder="Search member name or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${filterClass} flex-1 min-w-[200px]`}
        />
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className={filterClass}
        >
          <option value="">All products</option>
          {loanProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterClass}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paid">Paid</option>
        </select>
        <div>
          <label className="text-xs text-gray-500 block">Issued from</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={filterClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block">Issued to</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={filterClass}
          />
        </div>
        <Button variant="secondary" onClick={clearFilters}>
          Clear
        </Button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Showing {filteredLoans.length} of {loans.length} loans · Outstanding: ₦
        {filteredOutstanding.toLocaleString()}
      </p>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Member</th>
          <th className="py-3 px-6">Product</th>
          <th className="py-3 px-6">Principal</th>
          <th className="py-3 px-6">Interest</th>
          <th className="py-3 px-6">Date Issued</th>
          <th className="py-3 px-6">Duration</th>
          <th className="py-3 px-6">Outstanding</th>
          <th className="py-3 px-6">Status</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {filteredLoans.map((loan) => (
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
                      className={editInputClass}
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
                      className={editInputClass}
                    />
                  </td>
                  <td className="py-3 px-6 text-gray-400">—</td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(loan.date_issued).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={editForm.duration_value}
                        placeholder="e.g. 12"
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            duration_value: e.target.value,
                          })
                        }
                        className={editInputClass}
                      />
                      <select
                        value={editForm.duration_unit}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            duration_unit: e.target.value,
                          })
                        }
                        className={editInputClass}
                      >
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-400">—</td>
                  <td className="py-3 px-6">
                    <Badge status={loan.status} />
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex gap-2">
                      <Button onClick={() => saveEdit(loan.id)}>Save</Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingLoanId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <TableRow>
                  <td className="py-3 px-6 font-medium">
                    {loan.member_number ? `${loan.member_number} — ` : ""}
                    {loan.full_name}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {loan.product_name}
                  </td>
                  <td className="py-3 px-6">
                    ₦{parseFloat(loan.principal).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    ₦{parseFloat(loan.interest_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(loan.date_issued).toLocaleDateString()}
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
                  <td className="py-3 px-6">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => startEdit(loan)}
                      >
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
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(loan)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </TableRow>
              )}
              {expandedLoanId === loan.id && (
                <tr>
                  <td colSpan="9" className="bg-gray-50 px-6 py-4">
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
