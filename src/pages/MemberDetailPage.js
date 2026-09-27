import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getMemberDetail } from "../api/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import ProfileTabs from "../components/ProfileTabs";

function MemberDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetail();
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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { member, savingsBalance, loans } = data;
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseFloat(l.outstanding_balance),
    0,
  );

  return (
    <div>
      <ProfileTabs baseUrl={`/members/${id}`} />

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {member.full_name}
          </h2>
          <p className="text-gray-500 mt-1">
            {member.member_number && `No. ${member.member_number} · `}
            {member.email} · {member.phone} · <Badge status={member.status} />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm text-gray-500 font-medium">Savings Balance</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              ₦{parseFloat(savingsBalance).toLocaleString()}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 font-medium">
              Total Outstanding Loans
            </p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              ₦{totalOutstanding.toLocaleString()}
            </p>
          </Card>
        </div>

        <p className="text-sm text-gray-500">
          See the "Ledger" tab above for full savings, loan, and payment
          history.
        </p>
      </div>
    </div>
  );
}

export default MemberDetailPage;
