import React, { useState, useEffect } from "react";
import { getLoans } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    const res = await getLoans();
    setLoans(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  if (loading) return <p className="text-gray-500">Loading loans...</p>;

  return (
    <Table>
      <TableHead>
        <th className="py-3 px-6">Member</th>
        <th className="py-3 px-6">Principal</th>
        <th className="py-3 px-6">Interest</th>
        <th className="py-3 px-6">Date Issued</th>
        <th className="py-3 px-6">Outstanding</th>
        <th className="py-3 px-6">Status</th>
      </TableHead>
      <tbody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <td className="py-3 px-6 font-medium">{loan.full_name}</td>
            <td className="py-3 px-6">
              ₦{parseFloat(loan.principal).toLocaleString()}
            </td>
            <td className="py-3 px-6 text-gray-600">{loan.interest_rate}%</td>
            <td className="py-3 px-6 text-gray-600">
              {new Date(loan.date_issued).toLocaleDateString()}
            </td>
            <td className="py-3 px-6 font-medium">
              ₦{parseFloat(loan.outstanding_balance).toLocaleString()}
            </td>
            <td className="py-3 px-6">
              <Badge status={loan.status} />
            </td>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

export default LoanList;
