import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLoanPerformanceReport } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";

const remarkStyle = {
  Completed: "bg-blue-100 text-blue-700",
  "Performing well": "bg-green-100 text-green-700",
  "Behind schedule": "bg-amber-100 text-amber-700",
  Default: "bg-red-100 text-red-700",
  "No duration set": "bg-gray-100 text-gray-600",
};

function LoanPerformancePage() {
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getLoanPerformanceReport().then((res) => setLoans(res.data));
  }, []);

  const filtered =
    filter === "all" ? loans : loans.filter((l) => l.remark === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loan Performance Report</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All</option>
          <option value="Performing well">Performing well</option>
          <option value="Behind schedule">Behind schedule</option>
          <option value="Default">Default</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Member</th>
          <th className="py-3 px-6">Product</th>
          <th className="py-3 px-6">Principal</th>
          <th className="py-3 px-6">Date Issued</th>
          <th className="py-3 px-6">Duration</th>
          <th className="py-3 px-6">Elapsed</th>
          <th className="py-3 px-6">Remaining</th>
          <th className="py-3 px-6">Outstanding</th>
          <th className="py-3 px-6">Remark</th>
        </TableHead>
        <tbody>
          {filtered.map((l) => (
            <TableRow key={l.id}>
              <td className="py-3 px-6">
                <Link
                  to={`/members/${l.member_id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {l.member_number ? `${l.member_number} — ` : ""}
                  {l.full_name}
                </Link>
              </td>
              <td className="py-3 px-6 text-gray-600">{l.product_name}</td>
              <td className="py-3 px-6">
                ₦{parseFloat(l.principal).toLocaleString()}
              </td>
              <td className="py-3 px-6 text-gray-600">
                {new Date(l.date_issued).toLocaleDateString()}
              </td>
              <td className="py-3 px-6 text-gray-600">
                {l.duration_value ? `${l.duration_value} ${l.unit}` : "—"}
              </td>
              <td className="py-3 px-6 text-gray-600">
                {l.duration_value ? `${l.elapsed} ${l.unit}` : "—"}
              </td>
              <td className="py-3 px-6 text-gray-600">
                {l.remaining !== null
                  ? l.remaining < 0
                    ? `${Math.abs(l.remaining)} ${l.unit} overdue`
                    : `${l.remaining} ${l.unit}`
                  : "—"}
              </td>
              <td className="py-3 px-6 font-medium">
                ₦{parseFloat(l.outstanding_balance).toLocaleString()}
              </td>
              <td className="py-3 px-6">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${remarkStyle[l.remark]}`}
                >
                  {l.remark}
                </span>
              </td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default LoanPerformancePage;
