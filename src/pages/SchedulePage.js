import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPaymentSchedule } from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import ExportButtons from "../components/ExportButtons";

const statusStyle = {
  Paid: "bg-green-100 text-green-700",
  Partial: "bg-amber-100 text-amber-700",
  Pending: "bg-gray-100 text-gray-600",
  Overdue: "bg-red-100 text-red-700",
};

const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString();
const filterClass = "border border-gray-300 rounded-md px-3 py-2";

function SchedulePage() {
  const [periodType, setPeriodType] = useState("month");
  const [anchorDate, setAnchorDate] = useState(toLocalDateString(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setError("");
    getPaymentSchedule(periodType, anchorDate)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load the schedule"));
  }, [periodType, anchorDate]);

  const columns = useMemo(() => data?.columns || [], [data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (
        q &&
        !(
          r.full_name.toLowerCase().includes(q) ||
          (r.member_number || "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const totals = useMemo(() => {
    const t = { items: {}, expected: 0, paid: 0, balance: 0 };
    columns.forEach((c) => {
      t.items[c.key] = 0;
    });
    filteredRows.forEach((r) => {
      columns.forEach((c) => {
        t.items[c.key] += r.items[c.key]?.expected || 0;
      });
      t.expected += r.total_expected;
      t.paid += r.total_paid;
      t.balance += r.balance;
    });
    return t;
  }, [filteredRows, columns]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading schedule...</p>;

  const periodLabel = `${periodType === "week" ? "Weekly" : "Monthly"}: ${fmtDate(data.periodStart)} – ${fmtDate(data.periodEnd)}`;

  const exportColumns = [
    { key: "member_number", label: "Member No." },
    { key: "full_name", label: "Member" },
    ...columns.map((c) => ({ key: c.key, label: c.label })),
    { key: "total_expected", label: "Total Expected" },
    { key: "total_paid", label: "Total Paid" },
    { key: "balance", label: "Balance" },
    { key: "status", label: "Status" },
  ];
  const exportData = [
    ...filteredRows.map((r) => {
      const row = {
        member_number: r.member_number || "",
        full_name: r.full_name,
        total_expected: r.total_expected,
        total_paid: r.total_paid,
        balance: r.balance,
        status: r.status,
      };
      columns.forEach((c) => {
        row[c.key] = r.items[c.key]?.expected ?? 0;
      });
      return row;
    }),
    {
      member_number: "",
      full_name: "TOTAL",
      ...totals.items,
      total_expected: totals.expected,
      total_paid: totals.paid,
      balance: totals.balance,
      status: "",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Payment Schedule</h2>
          <p className="text-sm text-gray-500">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className={filterClass}
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className={filterClass}
          />
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName={`payment-schedule-${periodType}-${data.periodStart}`}
            title={`Payment Schedule — ${periodLabel}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Members scheduled</p>
          <p className="text-2xl font-bold">{filteredRows.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Total expected</p>
          <p className="text-2xl font-bold">{money(totals.expected)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Total paid</p>
          <p className="text-2xl font-bold text-green-600">
            {money(totals.paid)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Still to collect</p>
          <p className="text-2xl font-bold text-red-600">
            {money(totals.balance)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${filterClass} flex-1 min-w-[200px]`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterClass}
        >
          <option value="">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {columns.length === 0 ? (
        <p className="text-gray-500">
          Nothing is scheduled for a{" "}
          {periodType === "week" ? "weekly" : "monthly"} period yet. Mark a
          product as a compulsory due on the Products page, or issue loans with
          a duration set.
        </p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                <th className="py-3 px-4 sticky left-0 bg-gray-50">Member</th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="py-3 px-4 whitespace-nowrap text-right"
                  >
                    {c.label}
                  </th>
                ))}
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Total Expected
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Total Paid
                </th>
                <th className="py-3 px-4 whitespace-nowrap text-right">
                  Balance
                </th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.member_id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-2 px-4 whitespace-nowrap sticky left-0 bg-white">
                    <Link
                      to={`/members/${r.member_id}`}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      {r.member_number ? `${r.member_number} — ` : ""}
                      {r.full_name}
                    </Link>
                  </td>
                  {columns.map((c) => {
                    const item = r.items[c.key];
                    if (!item)
                      return (
                        <td
                          key={c.key}
                          className="py-2 px-4 text-right text-gray-300"
                        >
                          -
                        </td>
                      );
                    const color =
                      item.paid >= item.expected - 0.005
                        ? "text-green-700"
                        : item.paid > 0
                          ? "text-amber-700"
                          : "text-gray-900";
                    return (
                      <td
                        key={c.key}
                        className={`py-2 px-4 text-right whitespace-nowrap ${color}`}
                        title={`Paid ${money(item.paid)} of ${money(item.expected)}`}
                      >
                        {money(item.expected)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 text-right font-medium whitespace-nowrap">
                    {money(r.total_expected)}
                  </td>
                  <td className="py-2 px-4 text-right whitespace-nowrap">
                    {money(r.total_paid)}
                  </td>
                  <td className="py-2 px-4 text-right font-medium whitespace-nowrap">
                    {money(r.balance)}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0">
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <td className="py-3 px-4 sticky left-0 bg-gray-100">Total</td>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="py-3 px-4 text-right whitespace-nowrap"
                  >
                    {money(totals.items[c.key])}
                  </td>
                ))}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {money(totals.expected)}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {money(totals.paid)}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {money(totals.balance)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
