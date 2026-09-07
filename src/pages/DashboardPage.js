import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../api/api";
import Card from "../components/ui/Card";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getDashboardStats(year).then((res) => setStats(res.data));
  }, [year]);

  if (!stats) return <p className="text-gray-500">Loading...</p>;

  const monthlyData = stats.monthlySavings.map((m) => ({
    month: parseInt(m.month),
    total: parseFloat(m.total),
  }));
  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-28"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="text-3xl font-bold">{stats.memberCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Savings</p>
          <p className="text-3xl font-bold text-green-600">
            ₦{parseFloat(stats.totalSavings).toLocaleString()}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Loans Granted ({year})</p>
          <p className="text-3xl font-bold text-blue-600">
            ₦{parseFloat(stats.totalLoansGranted).toLocaleString()}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Outstanding Loans</p>
          <p className="text-3xl font-bold text-red-600">
            ₦{parseFloat(stats.totalOutstanding).toLocaleString()}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Monthly Savings — {year}</h3>
        <div className="flex items-end gap-2" style={{ height: "200px" }}>
          {MONTH_NAMES.map((name, i) => {
            const monthData = monthlyData.find((m) => m.month === i + 1);
            const value = monthData ? monthData.total : 0;
            const heightPct = maxMonthly > 0 ? (value / maxMonthly) * 100 : 0;
            return (
              <div
                key={name}
                className="flex-1 flex flex-col items-center justify-end gap-1 h-full"
              >
                <div
                  className="w-full bg-primary-500 rounded-t transition-all"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: value > 0 ? "4px" : "0px",
                  }}
                  title={`₦${value.toLocaleString()}`}
                />
                <span className="text-xs text-gray-500">{name}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
