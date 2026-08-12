import React, { useState, useEffect } from "react";
import { getBalanceSheet } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";

function Section({ title, rows, total, extra }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <Table>
        <TableHead>
          <th className="py-3 px-6">Account</th>
          <th className="py-3 px-6">Amount</th>
        </TableHead>
        <tbody>
          {rows.map((r) => (
            <TableRow key={r.code}>
              <td className="py-3 px-6">{r.name}</td>
              <td className="py-3 px-6">₦{r.net.toLocaleString()}</td>
            </TableRow>
          ))}
          {extra && (
            <TableRow>
              <td className="py-3 px-6">Surplus (current period)</td>
              <td className="py-3 px-6">₦{extra.toLocaleString()}</td>
            </TableRow>
          )}
          <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
            <td className="py-3 px-6">TOTAL {title.toUpperCase()}</td>
            <td className="py-3 px-6">₦{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

function BalanceSheetPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getBalanceSheet().then((res) => setData(res.data));
  }, []);
  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statement of Financial Position</h2>
      <p
        className={`text-sm font-medium ${data.balanced ? "text-green-600" : "text-red-600"}`}
      >
        {data.balanced
          ? "✓ Assets = Liabilities + Equity"
          : "⚠ Does not balance — check journal entries"}
      </p>

      <Section title="Assets" rows={data.assets} total={data.totalAssets} />
      <Section
        title="Liabilities"
        rows={data.liabilities}
        total={data.totalLiabilities}
      />
      <Section
        title="Equity"
        rows={data.equity}
        total={data.totalEquity}
        extra={data.surplus}
      />
    </div>
  );
}

export default BalanceSheetPage;
