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
