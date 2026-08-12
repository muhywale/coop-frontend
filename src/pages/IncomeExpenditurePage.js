import React, { useState, useEffect } from "react";
import { getIncomeExpenditure } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";

function IncomeExpenditurePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getIncomeExpenditure().then((res) => setData(res.data));
  }, []);
  if (!data) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Income & Expenditure Statement</h2>

      <Card>
        <p className="text-sm text-gray-500 font-medium">
          Surplus for the period
        </p>
        <p
          className={`text-3xl font-bold mt-1 ${data.surplus >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          ₦{data.surplus.toLocaleString()}
        </p>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-3">Income</h3>
        <Table>
          <TableHead>
            <th className="py-3 px-6">Account</th>
            <th className="py-3 px-6">Amount</th>
          </TableHead>
          <tbody>
            {data.income.map((r) => (
              <TableRow key={r.code}>
                <td className="py-3 px-6">{r.name}</td>
                <td className="py-3 px-6">₦{r.net.toLocaleString()}</td>
              </TableRow>
            ))}
            <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
              <td className="py-3 px-6">TOTAL INCOME</td>
              <td className="py-3 px-6">
                ₦{data.totalIncome.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Expenses</h3>
        <Table>
          <TableHead>
            <th className="py-3 px-6">Account</th>
            <th className="py-3 px-6">Amount</th>
          </TableHead>
          <tbody>
            {data.expenses.map((r) => (
              <TableRow key={r.code}>
                <td className="py-3 px-6">{r.name}</td>
                <td className="py-3 px-6">₦{r.net.toLocaleString()}</td>
              </TableRow>
            ))}
            <tr className="font-bold border-t-2 border-gray-300 bg-gray-50">
              <td className="py-3 px-6">TOTAL EXPENSES</td>
              <td className="py-3 px-6">
                ₦{data.totalExpenses.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default IncomeExpenditurePage;
