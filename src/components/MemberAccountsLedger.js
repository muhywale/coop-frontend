import React, { useState, useEffect, useCallback } from "react";
import { getAccountTheme } from "../utils/accountColors";

const money = (n) => {
  const value = Number(n) || 0;
  return value < 0
    ? `-₦${Math.abs(value).toLocaleString()}`
    : `₦${value.toLocaleString()}`;
};

function formatPeriod(period, groupBy) {
  const d = new Date(period);
  if (groupBy === "day") return d.toLocaleDateString();
  if (groupBy === "week") return `Week of ${d.toLocaleDateString()}`;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function LedgerBlock({ title, bf, periods, groupBy }) {
  const theme = getAccountTheme(title);

  // Tight on phones, roomier from tablet size up
  const cell = "py-2 px-2 sm:px-6";
  const number = `${cell} text-right whitespace-nowrap`;

  return (
    <div
      className={`mb-6 bg-white rounded-lg shadow-sm border-2 ${theme.accent} overflow-hidden`}
    >
      <div
        className={`flex flex-wrap justify-between items-center gap-x-4 gap-y-1 px-3 sm:px-6 py-3 sm:py-4 ${theme.header}`}
      >
        <h4 className="font-bold">{title}</h4>
        <span className="text-xs font-medium whitespace-nowrap">
          B/F: {money(bf)}
        </span>
      </div>

      {/* If a figure is still too wide for a very small screen, it scrolls here instead of being cut off */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wide border-b border-gray-100">
              <th className={cell}>Period</th>
              <th className={number}>DR</th>
              <th className={number}>CR</th>
              <th className={number}>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50 bg-gray-50">
              <td className={`${cell} font-medium`}>B/F</td>
              <td className={number}>-</td>
              <td className={number}>-</td>
              <td className={`${number} font-bold ${theme.bal}`}>
                {money(bf)}
              </td>
            </tr>
            {periods.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className={`${cell} sm:whitespace-nowrap`}>
                  {formatPeriod(p.period, groupBy)}
                </td>
                <td className={`${number} text-red-600`}>
                  {p.dr > 0 ? money(p.dr) : "-"}
                </td>
                <td className={`${number} text-green-600`}>
                  {p.cr > 0 ? money(p.cr) : "-"}
                </td>
                <td className={`${number} font-bold ${theme.bal}`}>
                  {money(p.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
