import React, { useState, useEffect } from "react";
import { getAccounts, getAccountLedger } from "../api/api";

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

function AccountLedgerPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [ledger, setLedger] = useState(null);

  useEffect(() => {
    getAccounts().then((res) => setAccounts(res.data));
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      getAccountLedger(selectedAccount, year).then((res) =>
        setLedger(res.data),
      );
    }
  }, [selectedAccount, year]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Account Ledger</h2>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-28"
        />
      </div>

      {ledger && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold">{ledger.account.name}</h3>
            <p className="text-sm text-gray-500">
              Brought forward: ₦{ledger.bf.toLocaleString()}
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">DR</th>
                <th className="py-3 px-4">CR</th>
                <th className="py-3 px-4">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50 bg-gray-50">
                <td className="py-2 px-4 font-medium">B/F</td>
                <td className="py-2 px-4">-</td>
                <td className="py-2 px-4">-</td>
                <td className="py-2 px-4 font-medium">
                  ₦{ledger.bf.toLocaleString()}
                </td>
              </tr>
              {ledger.months.map((m) => (
                <tr
                  key={m.month}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-2 px-4">{MONTH_NAMES[m.month - 1]}</td>
                  <td className="py-2 px-4">
                    {m.debit > 0 ? `₦${m.debit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2 px-4">
                    {m.credit > 0 ? `₦${m.credit.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2 px-4 font-medium">
                    ₦{m.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AccountLedgerPage;
