import React, { useState } from "react";
import LoanForm from "../components/Loans/LoanForm";
import LoanList from "../components/Loans/LoanList";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { runInterestAccrual } from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";

function LoansPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [accrualDate, setAccrualDate] = useState(toLocalDateString(new Date()));
  const [accrualMessage, setAccrualMessage] = useState("");

  const handleRunAccrual = async () => {
    if (
      !window.confirm(
        `Run interest accrual for all reducing-balance loans as at ${accrualDate}? This posts new interest charges — do this once per month.`,
      )
    )
      return;
    try {
      const res = await runInterestAccrual(accrualDate);
      setAccrualMessage(res.data.message);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setAccrualMessage(err.response?.data?.error || "Accrual failed");
    }
  };

  return (
    <div className="space-y-6">
      <LoanForm onLoanAdded={() => setRefreshKey((k) => k + 1)} />
      <LoanList key={refreshKey} />

      <Card>
        <h3 className="font-semibold mb-3">Monthly Interest Accrual</h3>
        <p className="text-xs text-gray-500 mb-3">
          Calculates and posts interest for all active reducing-balance loans,
          based on their current outstanding principal. Run this once per month.
        </p>
        <div className="flex items-end gap-3 max-w-md">
          <div className="flex-1">
            <label className="text-xs text-gray-500">As at date</label>
            <input
              type="date"
              value={accrualDate}
              onChange={(e) => setAccrualDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button onClick={handleRunAccrual}>Run Interest Accrual</Button>
        </div>
        {accrualMessage && (
          <p className="text-sm text-primary-700 mt-2">{accrualMessage}</p>
        )}
      </Card>
    </div>
  );
}

export default LoansPage;
