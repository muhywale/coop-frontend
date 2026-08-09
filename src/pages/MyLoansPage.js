import React, { useState, useEffect } from "react";
import { getMyLoans } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Badge from "../components/ui/Badge";

function MyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyLoans()
      .then((res) => setLoans(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Loans</h2>
      {loans.length === 0 ? (
        <p className="text-gray-500">You have no loans on record.</p>
      ) : (
        <Table>
          <TableHead>
            <th className="py-3 px-6">Principal</th>
            <th className="py-3 px-6">Interest</th>
            <th className="py-3 px-6">Date Issued</th>
            <th className="py-3 px-6">Status</th>
          </TableHead>
          <tbody>
            {loans.map((loan) => (
              <TableRow key={loan.id}>
                <td className="py-3 px-6">
                  ₦{parseFloat(loan.principal).toLocaleString()}
                </td>
                <td className="py-3 px-6 text-gray-600">
                  {loan.interest_rate}%
                </td>
                <td className="py-3 px-6 text-gray-600">
                  {new Date(loan.date_issued).toLocaleDateString()}
                </td>
                <td className="py-3 px-6">
                  <Badge status={loan.status} />
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default MyLoansPage;
