import React, { useState, useEffect } from "react";
import { getChartOfAccounts, getAccountStatement } from "../api/api";
import TLedger from "../components/TLedger";
import ExportButtons from "../components/ExportButtons";

const inputClass = "border border-gray-300 rounded-md px-3 py-2";

function AccountLedgerPage() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getChartOfAccounts().then((res) => {
      setAccounts(res.data);
      if (res.data.length > 0) setAccountId(String(res.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!accountId || String(year).length !== 4) return;
    setError("");
    getAccountStatement(accountId, year)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load the ledger"));
  }, [accountId, year]);

  const exportColumns = [
    { key: "month", label: "Month" },
    { key: "dr", label: "DR" },
    { key: "cr", label: "CR" },
  ];
  const exportData = data
    ? [
        ...data.ledger.rows.map((r) => ({
          month: r.label,
          dr: r.dr || "",
          cr: r.cr || "",
        })),
        {
          month: "BALANCE >",
          dr:
            data.ledger.balance.side === "dr" ? data.ledger.balance.amount : "",
          cr:
            data.ledger.balance.side === "cr" ? data.ledger.balance.amount : "",
        },
        { month: "TOTAL", dr: data.ledger.grand, cr: data.ledger.grand },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Account Ledger</h2>
        {data && (
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName={`ledger-${data.account.code}-${data.year}`}
            title={`${data.account.name} Ledger — ${data.year}`}
          />
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 block">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={`${inputClass} min-w-[260px]`}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="max-w-md">
          <TLedger ledger={data.ledger} year={data.year} />
          <p className="text-xs text-gray-500 mt-3">
            I &amp; E is the total interest added to loans in the year, shown
            once and kept out of the months. BALANCE &gt; is carried down and
            becomes next year's B/F.
          </p>
        </div>
      )}
    </div>
  );
}

export default AccountLedgerPage;
