import React, { useState, useEffect } from "react";
import { getPortalLoans } from "../api/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString();

function Fact({ label, value, strong }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={strong ? "font-bold" : "font-medium"}>{value}</p>
    </div>
  );
}

function LoanCard({ loan }) {
  const unit = loan.duration_unit === "weeks" ? "week" : "month";
  const active = loan.status === "active";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{loan.product_name}</h3>
          <p className="text-xs text-gray-500">
            Issued {fmt(loan.date_issued)}
            {loan.is_opening ? " · carried forward" : ""}
          </p>
        </div>
        <Badge status={loan.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
        <Fact label="Borrowed" value={money(loan.principal)} />
        <Fact
          label={loan.interest_added > 0 ? "Interest added" : "Interest"}
          value={
            loan.interest_added > 0
              ? money(loan.interest_added)
              : "Paid separately or none"
          }
        />
        <Fact label="Paid so far" value={money(loan.repaid)} />
        <Fact label="Balance" value={money(loan.outstanding)} strong />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Repaid</span>
          <span>{loan.progress_pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-green-500 rounded-full"
            style={{ width: `${loan.progress_pct}%` }}
          />
        </div>
      </div>

      {active && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
          <Fact
            label={`Installment (per ${unit})`}
            value={loan.installment ? money(loan.installment) : "—"}
          />
          <Fact
            label="Installments left"
            value={loan.installment ? `about ${loan.periods_left}` : "—"}
          />
          <Fact label="Expected to finish" value={loan.finish_label || "—"} />
        </div>
      )}

      {loan.interest_note && (
        <p className="text-xs text-gray-500 mt-4">{loan.interest_note}</p>
      )}

      {loan.repayments.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-primary-600 cursor-pointer">
            Repayments ({loan.repayments.length})
          </summary>
          <ul className="mt-2 divide-y divide-gray-100 text-sm max-h-60 overflow-y-auto">
            {loan.repayments.map((r, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span className="text-gray-600">{fmt(r.date)}</span>
                <span className="font-medium">{money(r.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

function MyLoansPage() {
  const [loans, setLoans] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPortalLoans()
      .then((res) => setLoans(res.data.loans))
      .catch(() => setError("Failed to load your loans"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!loans) return <p className="text-gray-500">Loading...</p>;

  const active = loans.filter((l) => l.status === "active");
  const cleared = loans.filter((l) => l.status !== "active");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Loans</h2>

      {loans.length === 0 && (
        <p className="text-gray-500">You have no loans.</p>
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          {active.map((l) => (
            <LoanCard key={l.id} loan={l} />
          ))}
        </div>
      )}

      {cleared.length > 0 && (
        <details>
          <summary className="text-lg font-semibold cursor-pointer">
            Cleared loans ({cleared.length})
          </summary>
          <div className="space-y-4 mt-4">
            {cleared.map((l) => (
              <LoanCard key={l.id} loan={l} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default MyLoansPage;
