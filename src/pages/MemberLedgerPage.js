import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getMemberLedger,
  getMemberAccountsLedger,
  getMemberPaymentsLedger,
} from "../api/api";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import MemberAccountsLedger from "../components/MemberAccountsLedger";
import PaymentHistoryTable from "../components/PaymentHistoryTable";
import ProfileTabs from "../components/ProfileTabs";

function MemberLedgerPage() {
  const { id } = useParams();
  const [ledger, setLedger] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMemberLedger(id)
      .then((res) => setLedger(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading ledger...</p>;

  return (
    <div>
      <ProfileTabs baseUrl={`/members/${id}`} />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Account Ledger (DR/CR/Balance)
          </h3>
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
      </div>
    </div>
  );
}

export default MemberLedgerPage;
