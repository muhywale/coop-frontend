import React, { useState, useEffect, useCallback } from "react";
import { getAccountTheme } from "../utils/accountColors";

function formatPeriod(period, groupBy) {
  const d = new Date(period);
  if (groupBy === "day") return d.toLocaleDateString();
  if (groupBy === "week") return `Week of ${d.toLocaleDateString()}`;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function LedgerBlock({ title, bf, periods, groupBy }) {
  const theme = getAccountTheme(title);
  return (
    <div
      className={`mb-6 bg-white rounded-lg shadow-sm border-2 ${theme.accent} overflow-hidden`}
    >
      <div
        className={`flex justify-between items-center px-6 py-4 ${theme.header}`}
      >
        <h4 className="font-bold">{title}</h4>
        <span className="text-xs font-medium">B/F: ₦{bf.toLocaleString()}</span>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
            <th className="py-2 px-6">Period</th>
            <th className="py-2 px-6">DR</th>
            <th className="py-2 px-6">CR</th>
            <th className="py-2 px-6">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-50 bg-gray-50">
            <td className="py-2 px-6 font-medium">B/F</td>
            <td className="py-2 px-6">-</td>
            <td className="py-2 px-6">-</td>
            <td className={`py-2 px-6 font-bold ${theme.bal}`}>
              ₦{bf.toLocaleString()}
            </td>
          </tr>
          {periods.map((p, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-2 px-6">{formatPeriod(p.period, groupBy)}</td>
              <td className="py-2 px-6 text-red-600">
                {p.dr > 0 ? `₦${p.dr.toLocaleString()}` : "-"}
              </td>
              <td className="py-2 px-6 text-green-600">
                {p.cr > 0 ? `₦${p.cr.toLocaleString()}` : "-"}
              </td>
              <td className={`py-2 px-6 font-bold ${theme.bal}`}>
                ₦{p.balance.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MemberAccountsLedger({ fetchFn }) {
  const [groupBy, setGroupBy] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    fetchFn(groupBy, year).then((res) => setData(res.data));
  }, [fetchFn, groupBy, year]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-28"
        />
      </div>

      <h3 className="text-lg font-semibold mb-3">Savings Accounts</h3>
      {data.savings.length === 0 ? (
        <p className="text-gray-500 mb-6">No records.</p>
      ) : (
        data.savings.map((block) => (
          <LedgerBlock
            key={block.product_name}
            title={block.product_name}
            bf={block.bf}
            periods={block.periods}
            groupBy={groupBy}
          />
        ))
      )}

      <h3 className="text-lg font-semibold mb-3">Loan Accounts</h3>
      {data.loans.length === 0 ? (
        <p className="text-gray-500">No records.</p>
      ) : (
        data.loans.map((block) => (
          <LedgerBlock
            key={block.product_name}
            title={block.product_name}
            bf={block.bf}
            periods={block.periods}
            groupBy={groupBy}
          />
        ))
      )}
    </div>
  );
}

export default MemberAccountsLedger;
