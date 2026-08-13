import React, { useState, useEffect, useCallback } from "react";

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
}

function getMonthRange(date) {
  const d = new Date(date);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
}

function PaymentHistoryTable({ fetchFn }) {
  const [filterType, setFilterType] = useState("month");
  const [anchorDate, setAnchorDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [from, to] =
      filterType === "week"
        ? getWeekRange(anchorDate)
        : getMonthRange(anchorDate);
    const res = await fetchFn(from, to);
    const data = res.data;

    const grouped = {};
    const colSet = new Set();
    data.forEach((r) => {
      const colLabel = r.product_name || r.type;
      colSet.add(colLabel);
      if (!grouped[r.date]) grouped[r.date] = { date: r.date };
      grouped[r.date][colLabel] =
        (grouped[r.date][colLabel] || 0) + parseFloat(r.amount);
    });

    setRows(
      Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)),
    );
    setColumns([...colSet]);
    setLoading(false);
  }, [filterType, anchorDate, fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const columnTotal = (col) => rows.reduce((sum, r) => sum + (r[col] || 0), 0);
  const rowTotal = (row) =>
    columns.reduce((sum, col) => sum + (row[col] || 0), 0);
  const grandTotal = columns.reduce((sum, col) => sum + columnTotal(col), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">View by</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Any date in that period
          </label>
          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">No payments recorded in this period.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                <th className="py-3 px-4 sticky left-0 bg-gray-50">Date</th>
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="py-3 px-4 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.date}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-2 px-4 whitespace-nowrap sticky left-0 bg-white">
                    {new Date(row.date).toLocaleDateString()}
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
                <td className="py-3 px-4 sticky left-0 bg-gray-100">TOTAL</td>
                {columns.map((col) => (
                  <td key={col} className="py-3 px-4">
                    ₦{columnTotal(col).toLocaleString()}
                  </td>
                ))}
                <td className="py-3 px-4">₦{grandTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryTable;
