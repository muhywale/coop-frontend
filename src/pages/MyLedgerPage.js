import React, { useState, useEffect } from "react";
import { getMyDetail, getMyLedger, getMyAccountsLedger } from "../api/api";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import MemberAccountsLedger from "../components/MemberAccountsLedger";
import PaymentHistoryTable from "../components/PaymentHistoryTable";
import ProfileTabs from "../components/ProfileTabs";
import { getMyPaymentsLedger } from "../api/api";

function MyLedgerPage() {
  const [ledger, setLedger] = useState({
    savingsByProduct: {},
    loansByProduct: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyLedger()
      .then((res) => setLedger(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading ledger...</p>;

  return (
    <div>
      <ProfileTabs baseUrl="/my-profile" />

      <div className="space-y-6">
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
                            <td className="py-2 px-6 text-gray-500">
                              {t.notes}
                            </td>
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
                          <th className="py-2 px-6">Interest</th>
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
                            <td className="py-2 px-6 text-gray-600">
                              ₦
                              {parseFloat(
                                l.interest_amount || 0,
                              ).toLocaleString()}
                            </td>
                            <td className="py-2 px-6">
                              {new Date(l.date_issued).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-6 font-medium">
                              ₦
                              {parseFloat(
                                l.outstanding_balance,
                              ).toLocaleString()}
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
          <h3 className="text-lg font-semibold mb-3">
            Account Ledger (DR/CR/Balance)
          </h3>
          <MemberAccountsLedger
            fetchFn={(groupBy, year) => getMyAccountsLedger(groupBy, year)}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Payment History</h3>
          <PaymentHistoryTable
            fetchFn={(from, to) => getMyPaymentsLedger(from, to)}
          />
        </div>
      </div>
    </div>
  );
}

export default MyLedgerPage;
