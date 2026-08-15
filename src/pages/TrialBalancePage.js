import React, { useState, useEffect } from "react";
import { getTrialBalance } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";

function TrialBalancePage() {
  const [rows, setRows] = useState([]);
  //const totalDebit = rows.reduce((sum, r) => sum + parseFloat(r.debit), 0);
  //const totalCredit = rows.reduce((sum, r) => sum + parseFloat(r.credit), 0);
  useEffect(() => {
    getTrialBalance().then((res) => setRows(res.data));
  }, []);

  const totalDebit = rows.reduce((sum, r) => sum + parseFloat(r.debit), 0);

  const totalCredit = rows.reduce((sum, r) => sum + parseFloat(r.credit), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Trial Balance</h2>
      <Table>
        <TableHead>
          <th className="py-3 px-6">Code</th>
          <th className="py-3 px-6">Account</th>
          <th className="py-3 px-6">Debit</th>
          <th className="py-3 px-6">Credit</th>
        </TableHead>
        <tbody>
          {rows
            .filter((r) => parseFloat(r.debit) > 0 || parseFloat(r.credit) > 0)
            .map((r) => (
              <TableRow key={r.code}>
                <td className="py-3 px-6">{r.code}</td>
                <td className="py-3 px-6">{r.name}</td>
                <td className="py-3 px-6">
                  {parseFloat(r.debit) > 0
                    ? `₦${parseFloat(r.debit).toLocaleString()}`
                    : ""}
                </td>
                <td className="py-3 px-6">
                  {parseFloat(r.credit) > 0
                    ? `₦${parseFloat(r.credit).toLocaleString()}`
                    : ""}
                </td>
              </TableRow>
            ))}
          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
            <td className="py-3 px-6" colSpan={2}>
              TOTAL
            </td>
            <td className="py-3 px-6">₦{totalDebit.toLocaleString()}</td>
            <td className="py-3 px-6">₦{totalCredit.toLocaleString()}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default TrialBalancePage;
