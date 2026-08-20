import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PaymentHistoryTable from "../components/PaymentHistoryTable";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import MemberAccountsLedger from "../components/MemberAccountsLedger";

import {
  getMemberDetail,
  getMemberTransactions,
  getMemberLedger,
  getMemberPaymentsLedger,
  getMemberAccountsLedger,
} from "../api/api";

function MemberDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // inside the component, add a second piece of state:
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchDetail();
    fetchTransactions();
  }, [id]);

  const fetchTransactions = async () => {
    const res = await getMemberTransactions(id);
    setTransactions(res.data);
  };

  const [ledger, setLedger] = useState({
    savingsByProduct: {},
    loansByProduct: {},
  });

  useEffect(() => {
    fetchDetail();
    getMemberLedger(id).then((res) => setLedger(res.data));
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await getMemberDetail(id);
      setData(response.data);
    } catch (err) {
      setError("Failed to load member details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    getMemberLedger(id).then((res) => setLedger(res.data));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { member, savingsBalance, contributions, loans } = data;
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseFloat(l.outstanding_balance),
    0,
  );

  const statusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      paid: "bg-blue-100 text-blue-700",
      inactive: "bg-gray-100 text-gray-600",
      defaulted: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Link
        to="/my-profile"
        className="text-primary-600 hover:underline text-sm"
      >
        ← Back to Members
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">{member.full_name}</h2>
        <p className="text-gray-500 mt-1">
          {member.email} · {member.phone} · {statusBadge(member.status)}
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Account Ledger</h3>
        <MemberAccountsLedger
          fetchFn={(groupBy, year) =>
            getMemberAccountsLedger(id, groupBy, year)
          }
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Payment History</h3>
        <PaymentHistoryTable
          fetchFn={(from, to) => getMemberPaymentsLedger(id, from, to)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 font-medium">Total Assets</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ₦{parseFloat(savingsBalance).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 font-medium">Total Liabilities</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            ₦{totalOutstanding.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-semibold px-6 py-4 border-b border-gray-100">
          Loans
        </h3>
        {loans.length === 0 ? (
          <p className="text-gray-500 px-6 py-4">No loans on record.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="py-3 px-6">Principal</th>
                <th className="py-3 px-6">Interest</th>
                <th className="py-3 px-6">Date Issued</th>
                <th className="py-3 px-6">Outstanding</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-6">
                    ₦{parseFloat(loan.principal).toLocaleString()}
                  </td>
                  <td className="py-3 px-6">{loan.interest_rate}%</td>
                  <td className="py-3 px-6">
                    {new Date(loan.date_issued).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 font-medium">
                    ₦{parseFloat(loan.outstanding_balance).toLocaleString()}
                  </td>
                  <td className="py-3 px-6">{statusBadge(loan.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Savings by Product</h3>
        {Object.keys(ledger.savingsByProduct).length === 0 ? (
          <p className="text-gray-500">No savings records yet.</p>
        ) : (
          Object.entries(ledger.savingsByProduct).map(
            ([productName, transactions]) => {
              const balance = transactions.reduce(
                (sum, t) =>
                  sum +
                  (t.type === "withdrawal"
                    ? -parseFloat(t.amount)
                    : parseFloat(t.amount)),
                0,
              );
              return (
                <CollapsibleSection
                  key={productName}
                  title={productName}
                  balance={balance}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                        <th className="py-2 px-6">Date</th>
                        <th className="py-2 px-6">Type</th>
                        <th className="py-2 px-6">Amount</th>
                        <th className="py-2 px-6">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} className="border-b border-gray-50">
                          <td className="py-2 px-6">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-6 capitalize">{t.type}</td>
                          <td
                            className={`py-2 px-6 ${t.type === "withdrawal" ? "text-red-600" : "text-green-600"}`}
                          >
                            {t.type === "withdrawal" ? "-" : "+"}₦
                            {parseFloat(t.amount).toLocaleString()}
                          </td>
                          <td className="py-2 px-6 text-gray-500">{t.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CollapsibleSection>
              );
            },
          )
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Loans by Product</h3>
        {Object.keys(ledger.loansByProduct).length === 0 ? (
          <p className="text-gray-500">No loans yet.</p>
        ) : (
          Object.entries(ledger.loansByProduct).map(
            ([productName, loanList]) => {
              const totalOutstanding = loanList.reduce(
                (sum, l) => sum + parseFloat(l.outstanding_balance),
                0,
              );
              return (
                <CollapsibleSection
                  key={productName}
                  title={productName}
                  balance={totalOutstanding}
                  balanceColor="text-red-600"
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                        <th className="py-2 px-6">Principal</th>
                        <th className="py-2 px-6">Rate</th>
                        <th className="py-2 px-6">Date Issued</th>
                        <th className="py-2 px-6">Outstanding</th>
                        <th className="py-2 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanList.map((l) => (
                        <tr key={l.id} className="border-b border-gray-50">
                          <td className="py-2 px-6">
                            ₦{parseFloat(l.principal).toLocaleString()}
                          </td>
                          <td className="py-2 px-6">{l.interest_rate}%</td>
                          <td className="py-2 px-6">
                            {new Date(l.date_issued).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-6 font-medium">
                            ₦
                            {parseFloat(l.outstanding_balance).toLocaleString()}
                          </td>
                          <td className="py-2 px-6">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CollapsibleSection>
              );
            },
          )
        )}
      </div>
    </div>
  );
}

export default MemberDetailPage;
