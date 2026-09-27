import React, { useState } from "react";
import { Link } from "react-router-dom";
import LoanForm from "../components/Loans/LoanForm";
import LoanList from "../components/Loans/LoanList";
import { runInterestAccrual } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";

function LoansPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [accrualDate, setAccrualDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [accrualMessage, setAccrualMessage] = useState("");

  const handleLoanAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleRunAccrual = async () => {
    if (
      !window.confirm(
        `Run interest accrual for all reducing-balance loans as at ${accrualDate}? This posts new interest charges — do this once per month.`,
      )
    )
      return;
    const res = await runInterestAccrual(accrualDate);
    setAccrualMessage(res.data.message);
  };

  return (
    <div>
      <LoanForm onLoanAdded={handleLoanAdded} />
      <LoanList key={refreshKey} />
      <Card>
        <h3 className="font-semibold mb-3">Monthly Interest Accrual</h3>
        <p className="text-xs text-gray-500 mb-3">
          Calculates and posts interest for all active reducing-balance loans,
          based on their current outstanding principal. Run this once per month.
        </p>
        <div className="flex items-end gap-3">
          <div>
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
