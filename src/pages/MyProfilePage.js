import React, { useState, useEffect } from "react";
import { getMyDetail, getMyTransactions } from "../api/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import { getMyLedger } from "../api/api";
import CollapsibleSection from "../components/ui/CollapsibleSection"; //

function MyProfilePage() {
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyDetail()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load your details"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getMyDetail()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load your details"))
      .finally(() => setLoading(false));

    getMyTransactions().then((res) => setTransactions(res.data));
  }, []);

  const [ledger, setLedger] = useState({
    savingsByProduct: {},
    loansByProduct: {},
  });

  useEffect(() => {
    getMyDetail()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load your details"))
      .finally(() => setLoading(false));

    getMyLedger().then((res) => setLedger(res.data));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { member, savingsBalance, contributions, loans } = data;
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseFloat(l.outstanding_balance),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome, {member.full_name}
        </h2>
        <p className="text-gray-500 mt-1">
          {member.email} · {member.phone} · <Badge status={member.status} />
        </p>
      </div>
      ...
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
      <div>
        <h3 className="text-lg font-semibold mb-3">Full Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions on record.</p>
        ) : (
          <CollapsibleSection title="Full Transaction History">
            <Table>
              <TableHead>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Source</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Notes</th>
              </TableHead>
              <tbody>
                {transactions.map((t) => (
                  <TableRow key={`${t.source}-${t.id}`}>
                    <td className="py-3 px-6 text-gray-600">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 capitalize text-gray-500">
                      {t.source.replace("_", " ")}
                    </td>
                    <td className="py-3 px-6 capitalize">{t.type}</td>
                    <td
                      className={`py-3 px-6 font-medium ${
                        t.source === "loan_issued" || t.type === "withdrawal"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {t.source === "loan_issued" || t.type === "withdrawal"
                        ? "-"
                        : "+"}
                      ₦{parseFloat(t.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-gray-500">{t.notes}</td>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

export default MyProfilePage;
