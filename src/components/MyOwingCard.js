import React, { useState, useEffect } from "react";
import { getPortalOwing } from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "./ui/Card";

const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString();

const statusStyle = {
  Paid: "bg-green-100 text-green-700",
  Partial: "bg-amber-100 text-amber-700",
  Pending: "bg-gray-100 text-gray-600",
  Overdue: "bg-red-100 text-red-700",
};

// Friendlier wording for a member than the admin schedule's column names
const itemLabel = (c) => {
  if (c.kind === "loan")
    return `Loan installment: ${c.label.replace(/ \(loan\)$/, "")}`;
  if (c.kind === "interest")
    return `Interest: ${c.label.replace(/ \(interest due\)$/, "")}`;
  return c.label;
};

function MyOwingCard() {
  const [period, setPeriod] = useState("month");
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    getPortalOwing(period, date)
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load this right now. Please try again."));
  }, [period, date]);

  const shift = (direction) => {
    const d = new Date(`${date}T00:00:00`);
    const next =
      period === "month"
        ? new Date(d.getFullYear(), d.getMonth() + direction, 1)
        : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * direction);
    setDate(toLocalDateString(next));
  };

  const row = data?.row;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold">
            What I owe {period === "month" ? "this month" : "this week"}
          </h3>
          {data && (
            <p className="text-xs text-gray-500">
              {fmt(data.periodStart)} – {fmt(data.periodEnd)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            aria-label="Previous"
          >
            ‹
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="month">Monthly</option>
            <option value="week">Weekly</option>
          </select>
          <button
            type="button"
            onClick={() => shift(1)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <p className="text-sm text-gray-500">Loading...</p>}

      {data && !row && (
        <p className="text-sm text-gray-500">
          Nothing is scheduled for you this {period}.
        </p>
      )}

      {row && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 px-3 text-right">Due</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 pl-3 text-right">Still to pay</th>
                </tr>
              </thead>
              <tbody>
                {data.columns.map((c) => {
                  const item = row.items[c.key];
                  const remaining = Math.max(item.expected - item.paid, 0);
                  return (
                    <tr key={c.key} className="border-b border-gray-50">
                      <td className="py-2 pr-3">{itemLabel(c)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        {money(item.expected)}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap text-green-700">
                        {money(item.paid)}
                      </td>
                      <td
                        className={`py-2 pl-3 text-right whitespace-nowrap font-medium ${remaining > 0 ? "text-red-600" : "text-gray-400"}`}
                      >
                        {remaining > 0 ? money(remaining) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-gray-200">
                  <td className="py-2 pr-3">Total</td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    {money(row.total_expected)}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap text-green-700">
                    {money(row.total_paid)}
                  </td>
                  <td className="py-2 pl-3 text-right whitespace-nowrap text-red-600">
                    {money(row.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[row.status]}`}
            >
              {row.status}
            </span>
          </p>
        </>
      )}
    </Card>
  );
}

export default MyOwingCard;
