import React, { useState, useEffect } from "react";
import { getPaymentsLedger, correctContribution } from "../api/api";
import { getAccountTheme } from "../utils/accountColors";

function PaymentsLedgerPage() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [correcting, setCorrecting] = useState(null);

  const fetchLedger = async () => {
    const res = await getPaymentsLedger();
    const data = res.data;
    setRawData(data);

    const grouped = {};
    const colSet = new Set();
    data.forEach((r) => {
      const key = `${r.date}-${r.full_name}`;
      const colLabel = r.product_name || r.type;
      colSet.add(colLabel);
      if (!grouped[key])
        grouped[key] = { date: r.date, full_name: r.full_name };
      grouped[key][colLabel] =
        (grouped[key][colLabel] || 0) + parseFloat(r.amount);
      if (!grouped[key][`${colLabel}__ids`])
        grouped[key][`${colLabel}__ids`] = [];
      grouped[key][`${colLabel}__ids`].push({
        id: r.id,
        source: r.source,
        amount: r.amount,
      });
    });

    setRows(Object.values(grouped));
    setColumns([...colSet]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLedger();
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
              {columns.map((col) => {
                const theme = getAccountTheme(col);
                return (
                  <th
                    key={col}
                    className={`py-3 px-4 whitespace-nowrap ${theme.header}`}
                  >
                    {col}
                  </th>
                );
              })}
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
                {columns.map((col) => {
                  const value = row[col];
                  const ids = row[`${col}__ids`] || [];
                  return (
                    <td key={col} className="py-2 px-4">
                      {value ? (
                        <button
                          onClick={() =>
                            setCorrecting({
                              label: col,
                              ids,
                              member: row.full_name,
                              date: row.date,
                            })
                          }
                          className="hover:underline hover:text-red-600"
                        >
                          ₦{value.toLocaleString()}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
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

        {correcting && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            onClick={() => setCorrecting(null)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-2">
                Correct: {correcting.label}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {correcting.member} —{" "}
                {new Date(correcting.date).toLocaleDateString()}
              </p>
              {correcting.ids.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <span>₦{parseFloat(t.amount).toLocaleString()}</span>
                  <button
                    onClick={async () => {
                      await correctContribution(t.id);
                      setCorrecting(null);
                      window.location.reload();
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Reverse this entry
                  </button>
                </div>
              ))}
              <button
                onClick={() => setCorrecting(null)}
                className="mt-4 text-sm text-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentsLedgerPage;
