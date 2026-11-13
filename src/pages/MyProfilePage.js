import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPortalSummary, getPortalStatement } from "../api/api";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ProfileTabs from "../components/ProfileTabs";
import MyOwingCard from "../components/MyOwingCard";
import {
  downloadStatementPDF,
  downloadStatementExcel,
} from "../utils/statementExport";

const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const thisYear = new Date().getFullYear();

function MyProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [year, setYear] = useState(thisYear);
  const [busy, setBusy] = useState("");
  const [statementError, setStatementError] = useState("");

  useEffect(() => {
    getPortalSummary()
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load your details"));
  }, []);

  const download = async (kind) => {
    setBusy(kind);
    setStatementError("");
    try {
      const res = await getPortalStatement(year);
      if (kind === "pdf") downloadStatementPDF(res.data);
      else downloadStatementExcel(res.data);
    } catch {
      setStatementError("Couldn't prepare your statement. Please try again.");
    } finally {
      setBusy("");
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-gray-500">Loading...</p>;

  const { member, savings, savings_total: savingsTotal, loans } = data;
  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);

  return (
    <div>
      <ProfileTabs baseUrl="/my-profile" />

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {member.full_name}
          </h2>
          <p className="text-gray-500 mt-1">
            {member.member_number && `No. ${member.member_number} · `}
            {member.phone}
            {member.phone && member.email ? " · " : ""}
            {member.email} · <Badge status={member.status} />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm text-gray-500 font-medium">Total savings</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {money(savingsTotal)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 font-medium">
              Loans outstanding
              {loans.active_count > 0 ? ` (${loans.active_count})` : ""}
            </p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              {money(loans.outstanding)}
            </p>
            {loans.active_count > 0 && (
              <Link
                to="/my-loans"
                className="text-sm text-primary-600 hover:underline mt-1 inline-block"
              >
                See loan details →
              </Link>
            )}
          </Card>
        </div>

        <MyOwingCard />

        <div>
          <h3 className="text-lg font-semibold mb-3">My savings</h3>
          {savings.length === 0 ? (
            <p className="text-gray-500">No savings recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {savings.map((s) => (
                <Card key={s.id}>
                  <p className="text-xs text-gray-500">{s.name}</p>
                  <p className="text-lg font-bold mt-1">{money(s.balance)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card>
          <h3 className="font-semibold mb-1">Download my statement</h3>
          <p className="text-sm text-gray-500 mb-3">
            Your savings, loans and every transaction for the year, ready to
            show a bank or an employer.
          </p>
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
            <Button onClick={() => download("pdf")} disabled={!!busy}>
              {busy === "pdf" ? "Preparing..." : "Download PDF"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => download("xlsx")}
              disabled={!!busy}
            >
              {busy === "xlsx" ? "Preparing..." : "Download Excel"}
            </Button>
          </div>
          {statementError && (
            <p className="text-sm text-red-600 mt-2">{statementError}</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default MyProfilePage;
