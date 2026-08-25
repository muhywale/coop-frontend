import React, { useState, useEffect } from "react";
import { getMyDetail, getMyTransactions } from "../api/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import { getMyLedger } from "../api/api";
import CollapsibleSection from "../components/ui/CollapsibleSection"; //
import PaymentHistoryTable from "../components/PaymentHistoryTable";
import MemberAccountsLedger from "../components/MemberAccountsLedger";
import { getMyPaymentsLedger, getMyAccountsLedger } from "../api/api";

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
        <h3 className="text-lg font-semibold mb-3">Account Ledger</h3>
        <MemberAccountsLedger
          fetchFn={(groupBy, year) => getMyAccountsLedger(groupBy, year)}
        />
      </div>
      <div>
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

export default MyProfilePage;
