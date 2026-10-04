import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPaymentSchedule } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import { toLocalDateString } from "../utils/dateHelper";

const statusStyle = {
  Paid: "bg-green-100 text-green-700",
  "Performing well": "bg-green-100 text-green-700",
  "On track": "bg-blue-100 text-blue-700",
  Partial: "bg-amber-100 text-amber-700",
  Pending: "bg-gray-100 text-gray-600",
  Overdue: "bg-red-100 text-red-700",
  "Behind schedule": "bg-amber-100 text-amber-700",
  Completed: "bg-blue-100 text-blue-700",
};

function Badge({ status }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function SchedulePage() {
  const [periodType, setPeriodType] = useState("month");
  const [anchorDate, setAnchorDate] = useState(toLocalDateString(new Date()));
  const [data, setData] = useState(null);

  useEffect(() => {
    getPaymentSchedule(periodType, anchorDate).then((res) => setData(res.data));
  }, [periodType, anchorDate]);

  if (!data) return <p className="text-gray-500">Loading schedule...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Payment Schedule</h2>
        <div className="flex gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Period: {new Date(data.periodStart).toLocaleDateString()} –{" "}
        {new Date(data.periodEnd).toLocaleDateString()}
      </p>

      <div>
        <h3 className="text-lg font-semibold mb-3">Compulsory Dues</h3>
        {data.duesRows.length === 0 ? (
          <p className="text-gray-500">
            No compulsory dues set for this period type. Mark a product as
            compulsory on the Products page.
          </p>
        ) : (
          <Table>
            <TableHead>
              <th className="py-3 px-6">Member</th>
              <th className="py-3 px-6">Due</th>
              <th className="py-3 px-6">Expected</th>
              <th className="py-3 px-6">Paid</th>
              <th className="py-3 px-6">Status</th>
            </TableHead>
            <tbody>
              {data.duesRows.map((r, i) => (
                <TableRow key={i}>
                  <td className="py-3 px-6">
                    <Link
                      to={`/members/${r.member_id}`}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      {r.member_number ? `${r.member_number} — ` : ""}
                      {r.full_name}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{r.product_name}</td>
                  <td className="py-3 px-6">
                    ₦{r.expected_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-6">
                    ₦{r.paid_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-6">
                    <Badge status={r.status} />
                  </td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Loan Installments</h3>
        {data.loanRows.length === 0 ? (
          <p className="text-gray-500">
            No active loans with a{" "}
            {periodType === "week" ? "weekly" : "monthly"} repayment schedule.
          </p>
        ) : (
          <Table>
            <TableHead>
              <th className="py-3 px-6">Member</th>
              <th className="py-3 px-6">Loan</th>
              <th className="py-3 px-6">Installment</th>
              <th className="py-3 px-6">Paid This Period</th>
              <th className="py-3 px-6">Outstanding</th>
              <th className="py-3 px-6">Status</th>
            </TableHead>
            <tbody>
              {data.loanRows.map((r) => (
                <TableRow key={r.loan_id}>
                  <td className="py-3 px-6">
                    <Link
                      to={`/members/${r.member_id}`}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      {r.member_number ? `${r.member_number} — ` : ""}
                      {r.full_name}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-gray-600">{r.product_name}</td>
                  <td className="py-3 px-6">
                    ₦
                    {r.installment.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 px-6">
                    ₦{r.paid_this_period.toLocaleString()}
                  </td>
                  <td className="py-3 px-6 font-medium">
                    ₦{r.outstanding.toLocaleString()}
                  </td>
                  <td className="py-3 px-6">
                    <Badge status={r.status} />
                  </td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default SchedulePage;
