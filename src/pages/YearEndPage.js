import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getYearEndReport } from "../api/api";
import {
  buildTable,
  num,
  downloadYearEndExcel,
  downloadYearEndPDF,
} from "../utils/yearEndExport";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const thisYear = new Date().getFullYear();

function YearEndPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    getYearEndReport(year)
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load the report. Please try again."));
  }, [year]);

  const years = Array.from({ length: 8 }, (_, i) => thisYear - i);
  const table = data ? buildTable(data) : null;
  const q = search.trim().toLowerCase();
  const shown = table
    ? table.body.filter(
        (row) =>
          !q ||
          String(row[1]).toLowerCase().includes(q) ||
          String(row[0]).toLowerCase().includes(q),
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Year-End Report</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            disabled={!data}
            onClick={() => downloadYearEndExcel(data, user?.cooperative_name)}
          >
            Download Excel
          </Button>
          <Button
            variant="secondary"
            disabled={!data}
            onClick={() => downloadYearEndPDF(data, user?.cooperative_name)}
          >
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <details>
          <summary className="text-sm font-medium cursor-pointer">
            What each column means
          </summary>
          <ul className="text-sm text-gray-600 mt-3 space-y-1 list-disc pl-5">
            <li>
              <strong>Savings accounts:</strong> each member's balance as at 31
              December {year}.
            </li>
            <li>
              <strong>Paid in / Withdrawn this year:</strong> deposits and
              withdrawals during {year}. Carried-forward balances are not
              counted as deposits.
            </li>
            <li>
              <strong>One-off interest charged:</strong> interest added to loans
              issued during {year}.
            </li>
            <li>
              <strong>Interest paid separately:</strong> payments into interest
              lines (such as Building Loan Interest) during {year}.
            </li>
            <li>
              <strong>Loan repayments:</strong> everything repaid on loans
              during {year}, principal and one-off interest.
            </li>
            <li>
              <strong>Loans owed at year end:</strong> what each member still
              owed on 31 December {year}, including loans cleared since.
            </li>
          </ul>
        </details>
      </Card>

      <input
        placeholder="Search by name or member number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!data && !error && <p className="text-gray-500">Loading...</p>}
      {data && data.rows.length === 0 && (
        <p className="text-gray-500">Nothing recorded for {year}.</p>
      )}

      {table && data.rows.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[65vh]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                {table.head.map((h, i) => (
                  <th
                    key={h + i}
                    className={`py-2 px-3 whitespace-nowrap ${i >= 2 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, r) => (
                <tr
                  key={data.rows[table.body.indexOf(row)]?.member_id ?? r}
                  className="border-b border-gray-50"
                >
                  {row.map((v, i) => (
                    <td
                      key={i}
                      className={`py-1.5 px-3 whitespace-nowrap ${i >= 2 ? "text-right" : ""}`}
                    >
                      {i < 2 ? (
                        v
                      ) : v ? (
                        num(v)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-100">
              <tr className="font-bold border-t-2 border-gray-300">
                {table.foot.map((v, i) => (
                  <td
                    key={i}
                    className={`py-2 px-3 whitespace-nowrap ${i >= 2 ? "text-right" : ""}`}
                  >
                    {i < 2 ? v : num(v)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {data && (
        <p className="text-xs text-gray-500">
          {shown.length} of {data.rows.length} members shown. The totals row
          always covers everyone.
        </p>
      )}
    </div>
  );
}

export default YearEndPage;
