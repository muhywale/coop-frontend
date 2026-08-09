import React, { useState, useEffect } from "react";
import { getPaymentsLedger } from "../api/api";

function PaymentsLedgerPage() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentsLedger().then((res) => {
      const data = res.data;

      // group by date + member into one row, columns = product/type
      const grouped = {};
      const colSet = new Set();

      data.forEach((r) => {
        const key = `${r.date}-${r.full_name}`;
        const colLabel = r.product_name || r.type;
        colSet.add(colLabel);

        if (!grouped[key]) {
          grouped[key] = { date: r.date, full_name: r.full_name };
        }
        grouped[key][colLabel] =
          (grouped[key][colLabel] || 0) + parseFloat(r.amount);
      });

      setRows(Object.values(grouped));
      setColumns([...colSet]);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Loading ledger...</p>;

  const columnTotal = (col) => rows.reduce((sum, r) => sum + (r[col] || 0), 0);
  const rowTotal = (row) =>
    columns.reduce((sum, col) => sum + (row[col] || 0), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Payments Ledger</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <th className="py-3 px-4 sticky left-0 bg-gray-50">Date</th>
              <th className="py-3 px-4 sticky left-16 bg-gray-50">Member</th>
              {columns.map((col) => (
                <th key={col} className="py-3 px-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
              <th className="py-3 px-4 font-bold">Row Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-4 whitespace-nowrap">
                  {new Date(row.date).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 font-medium whitespace-nowrap">
                  {row.full_name}
                </td>
                {columns.map((col) => (
                  <td key={col} className="py-2 px-4">
                    {row[col] ? `₦${row[col].toLocaleString()}` : "-"}
                  </td>
                ))}
                <td className="py-2 px-4 font-bold">
                  ₦{rowTotal(row).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <td className="py-3 px-4" colSpan={2}>
                Column Total
              </td>
              {columns.map((col) => (
                <td key={col} className="py-3 px-4">
                  ₦{columnTotal(col).toLocaleString()}
                </td>
              ))}
              <td className="py-3 px-4">
                ₦
                {columns
                  .reduce((sum, col) => sum + columnTotal(col), 0)
                  .toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default PaymentsLedgerPage;
