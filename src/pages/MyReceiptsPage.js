import React, { useState, useEffect } from "react";
import { getPortalPayments, getPortalReceipt } from "../api/api";
import { downloadReceiptPDF } from "../utils/receiptExport";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const thisYear = new Date().getFullYear();

function MyReceiptsPage() {
  const [year, setYear] = useState(thisYear);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    setPayments(null);
    setError("");
    getPortalPayments(year)
      .then((res) => setPayments(res.data.payments))
      .catch(() => setError("Couldn't load your payments. Please try again."));
  }, [year]);

  const download = async (p) => {
    const key = `${p.kind}-${p.id}`;
    setBusyKey(key);
    setError("");
    try {
      const res = await getPortalReceipt(p.kind, p.id);
      downloadReceiptPDF(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't prepare that receipt.");
    } finally {
      setBusyKey("");
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">My Receipts</h2>
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
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!payments && !error && <p className="text-gray-500">Loading...</p>}
      {payments && payments.length === 0 && (
        <p className="text-gray-500">No payments recorded for {year}.</p>
      )}

      {payments && payments.length > 0 && (
        <Card>
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => {
              const key = `${p.kind}-${p.id}`;
              return (
                <li
                  key={key}
                  className="py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.description}
                      {p.product ? `: ${p.product}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(`${p.date}T00:00:00`).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-medium ${p.outgoing ? "text-red-600" : "text-green-700"}`}
                    >
                      {p.outgoing ? "−" : ""}
                      {money(p.amount)}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => download(p)}
                      disabled={busyKey === key}
                    >
                      {busyKey === key ? "Preparing..." : "Receipt"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default MyReceiptsPage;
