import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  getProducts,
  getMembers,
  matchBankList,
  importBankLoans,
} from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import MemberSearchSelect from "../components/MemberSearchSelect";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
const AUTO_CONFIRMED = ["account", "alias", "exact"];
const MAX_VISIBLE = 150;

const STATUS_STYLE = {
  account: { label: "Account no. match", cls: "bg-green-100 text-green-700" },
  alias: { label: "Saved match", cls: "bg-green-100 text-green-700" },
  exact: { label: "Exact name", cls: "bg-green-100 text-green-700" },
  confident: {
    label: "Suggested — please check",
    cls: "bg-amber-100 text-amber-700",
  },
  ambiguous: { label: "Several possible", cls: "bg-amber-100 text-amber-700" },
  none: { label: "No match", cls: "bg-red-100 text-red-700" },
  manual: { label: "Chosen manually", cls: "bg-blue-100 text-blue-700" },
};

const parseAmount = (v) =>
  parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")) || 0;

// Bank sheets use day/month/year. Never let JavaScript guess month/day for text dates.
const parseBankDate = (value) => {
  if (value instanceof Date && !isNaN(value.getTime()))
    return toLocalDateString(value);
  const s = String(value ?? "").trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : toLocalDateString(parsed);
};

const guessColumn = (cols, regex) => cols.find((c) => regex.test(c)) || "";

function ReviewRow({ row, members, onChange }) {
  const style = row.manual ? STATUS_STYLE.manual : STATUS_STYLE[row.status];
  const canConfirm = !!row.memberId && !!row.date;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start border-b border-gray-100 py-3">
      <div className="lg:col-span-3">
        <p className="font-medium text-sm">{row.name}</p>
        <p className="text-xs text-gray-500">
          {row.accountNumber
            ? `Acct ${row.accountNumber}`
            : "No account number"}
          {row.purpose ? ` · ${row.purpose}` : ""}
        </p>
        <span
          className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.cls}`}
        >
          {style.label}
        </span>
      </div>

      <div className="lg:col-span-2">
        <p className="text-sm font-medium">₦{row.amount.toLocaleString()}</p>
        <input
          type="date"
          value={row.date || ""}
          onChange={(e) =>
            onChange(row.idx, {
              date: e.target.value || null,
              ...(e.target.value ? {} : { confirmed: false }),
            })
          }
          className={`mt-1 border rounded-md px-2 py-1 text-sm ${row.date ? "border-gray-300" : "border-red-400"}`}
        />
      </div>

      <div className="lg:col-span-5">
        <MemberSearchSelect
          members={members}
          suggestedIds={row.candidates.map((c) => c.id)}
          value={row.memberId || ""}
          onChange={(id) =>
            onChange(row.idx, {
              memberId: id || null,
              manual: !!id,
              confirmed: !!id && !!row.date,
            })
          }
        />
        {!row.confirmed && row.candidates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {row.candidates
              .filter((c) => c.id !== row.memberId)
              .slice(0, 3)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    onChange(row.idx, {
                      memberId: c.id,
                      manual: true,
                      confirmed: !!row.date,
                    })
                  }
                  className="text-xs border border-gray-300 rounded-full px-2 py-1 hover:bg-primary-50"
                >
                  Use {c.member_number ? `${c.member_number} — ` : ""}
                  {c.full_name}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!canConfirm}
            checked={row.confirmed && canConfirm}
            onChange={(e) => onChange(row.idx, { confirmed: e.target.checked })}
          />
          Confirmed
        </label>
      </div>
    </div>
  );
}

function BankLoanImportPage() {
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [mapping, setMapping] = useState({
    name: "",
    account: "",
    amount: "",
    date: "",
    purpose: "",
  });
  const [loanProducts, setLoanProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [productId, setProductId] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("months");

  const [reviewRows, setReviewRows] = useState(null);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [view, setView] = useState("attention");
  const [matching, setMatching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getProducts().then((res) =>
      setLoanProducts(res.data.filter((p) => p.category === "loan")),
    );
    getMembers().then((res) => setMembers(res.data));
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setReviewRows(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, {
        type: "binary",
        cellDates: true,
      });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let headerRowIndex = grid.findIndex((row) => {
        const cells = row.map((c) => String(c));
        return (
          cells.some((c) => /name/i.test(c)) &&
          cells.some((c) => /amount|amt/i.test(c))
        );
      });
      if (headerRowIndex === -1) {
        headerRowIndex = grid.findIndex(
          (row) => row.filter((c) => String(c).trim() !== "").length >= 3,
        );
      }
      if (headerRowIndex === -1) headerRowIndex = 0;

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        range: headerRowIndex,
      });
      if (json.length === 0) return;

      const cols = Object.keys(json[0]);
      setColumns(cols);
      setRawRows(json);
      setMapping({
        name: guessColumn(cols, /name/i),
        account: guessColumn(cols, /(acc(ou)?nt|a\/c).*(no|num)|nuban/i),
        amount: guessColumn(cols, /amount|amt/i),
        date: guessColumn(cols, /date/i),
        purpose: guessColumn(cols, /purpose|narration|remark/i),
      });
    };
    reader.readAsBinaryString(file);
  };

  const handleFindMatches = async () => {
    if (!mapping.name || !mapping.amount) {
      alert("Select at least the Name and Amount columns first");
      return;
    }

    const parsed = rawRows
      .map((r, i) => ({
        idx: i,
        name: String(r[mapping.name] ?? "").trim(),
        accountNumber: mapping.account
          ? String(r[mapping.account] ?? "").trim()
          : "",
        amount: parseAmount(r[mapping.amount]),
        date: mapping.date ? parseBankDate(r[mapping.date]) : null,
        purpose: mapping.purpose ? String(r[mapping.purpose] ?? "").trim() : "",
      }))
      .filter(
        (r) => r.name && r.amount > 0 && !/^\s*(grand\s*)?total/i.test(r.name),
      );

    if (parsed.length === 0) {
      alert("No usable rows found — check the Name and Amount columns");
      return;
    }

    setMatching(true);
    setResult(null);
    try {
      const res = await matchBankList(
        parsed.map((r) => ({
          idx: r.idx,
          name: r.name,
          account_number: r.accountNumber,
        })),
      );
      const byIdx = {};
      res.data.forEach((m) => {
        byIdx[m.idx] = m;
      });

      setReviewRows(
        parsed.map((r) => {
          const m = byIdx[r.idx] || {
            status: "none",
            member_id: null,
            candidates: [],
          };
          return {
            ...r,
            status: m.status,
            memberId: m.member_id,
            candidates: m.candidates,
            manual: false,
            confirmed: AUTO_CONFIRMED.includes(m.status) && !!r.date,
          };
        }),
      );
      setIgnoredCount(rawRows.length - parsed.length);
      setView("attention");
    } catch (err) {
      setResult({
        message: "Matching failed",
        skipped: [{ reason: err.response?.data?.error || err.message }],
      });
    } finally {
      setMatching(false);
    }
  };

  const updateRow = (idx, patch) =>
    setReviewRows((rows) =>
      rows.map((r) => (r.idx === idx ? { ...r, ...patch } : r)),
    );

  const confirmAllSuggested = () =>
    setReviewRows((rows) =>
      rows.map((r) =>
        r.status === "confident" && !r.manual && r.memberId && r.date
          ? { ...r, confirmed: true }
          : r,
      ),
    );

  const handleImport = async () => {
    if (!productId) {
      alert("Select the loan product these belong to first");
      return;
    }
    const toImport = reviewRows.filter(
      (r) => r.confirmed && r.memberId && r.date,
    );
    if (toImport.length === 0) {
      alert("Nothing confirmed yet");
      return;
    }
    const total = toImport.reduce((s, r) => s + r.amount, 0);
    if (
      !window.confirm(
        `Import ${toImport.length} loan(s) totalling ₦${total.toLocaleString()}? Rows not confirmed will be left out.`,
      )
    )
      return;

    setImporting(true);
    try {
      const res = await importBankLoans({
        loans: toImport.map((r) => ({
          member_id: r.memberId,
          amount: r.amount,
          date: r.date,
          account_number: r.accountNumber,
          bank_name: r.name,
          idx: r.idx,
        })),
        productId,
        durationValue: durationValue || null,
        durationUnit,
      });
      setResult(res.data);
    } catch (err) {
      setResult({
        message: "Import failed",
        skipped: [{ reason: err.response?.data?.error || err.message }],
      });
    } finally {
      setImporting(false);
    }
  };

  const counts = reviewRows
    ? {
        total: reviewRows.length,
        auto: reviewRows.filter((r) => AUTO_CONFIRMED.includes(r.status))
          .length,
        suggested: reviewRows.filter((r) => r.status === "confident").length,
        attention: reviewRows.filter((r) =>
          ["ambiguous", "none"].includes(r.status),
        ).length,
        confirmed: reviewRows.filter((r) => r.confirmed && r.memberId && r.date)
          .length,
        confirmedTotal: reviewRows
          .filter((r) => r.confirmed && r.memberId && r.date)
          .reduce((s, r) => s + r.amount, 0),
      }
    : null;

  const filtered = reviewRows
    ? view === "attention"
      ? reviewRows.filter((r) => !r.confirmed)
      : reviewRows
    : [];
  const visible = filtered.slice(0, MAX_VISIBLE);

  const columnSelect = (key, label, optional = false) => (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={mapping[key]}
        onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
        className={inputClass}
      >
        <option value="">{optional ? "None" : "Select..."}</option>
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bank Loan List Import</h2>

      <Card>
        <h3 className="font-semibold mb-3">1. Upload the bank list</h3>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        {fileName && (
          <p className="text-xs text-gray-500 mt-2">
            Loaded "{fileName}" — {rawRows.length} rows, {columns.length}{" "}
            columns detected.
          </p>
        )}
      </Card>

      {columns.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">
            2. Confirm the columns and loan details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {columnSelect("name", "Account name")}
            {columnSelect("account", "Account number", true)}
            {columnSelect("amount", "Amount")}
            {columnSelect("date", "Date")}
            {columnSelect(
              "purpose",
              "Purpose (shown for reference only)",
              true,
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500">
                Loan product for this list
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select...</option>
                {loanProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Duration</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Duration unit</label>
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className={inputClass}
              >
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>
          <Button onClick={handleFindMatches} disabled={matching}>
            {matching ? "Matching..." : "Find matching members"}
          </Button>
        </Card>
      )}

      {reviewRows && (
        <Card>
          <h3 className="font-semibold mb-3">3. Review matches</h3>
          <p className="text-sm text-gray-600 mb-3">
            {counts.total} rows · {counts.auto} matched automatically ·{" "}
            {counts.suggested} suggested (please check) · {counts.attention}{" "}
            need you to choose
            {ignoredCount > 0
              ? ` · ${ignoredCount} blank/total rows ignored`
              : ""}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Button variant="secondary" onClick={confirmAllSuggested}>
              Confirm all suggested matches
            </Button>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="attention">Show: not yet confirmed</option>
              <option value="all">Show: all rows</option>
            </select>
            <span className="text-xs text-gray-500">
              Confirmed: {counts.confirmed} · ₦
              {counts.confirmedTotal.toLocaleString()}
            </span>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              Nothing left to review in this view.
            </p>
          ) : (
            visible.map((row) => (
              <ReviewRow
                key={row.idx}
                row={row}
                members={members}
                onChange={updateRow}
              />
            ))
          )}
          {filtered.length > MAX_VISIBLE && (
            <p className="text-xs text-gray-500 mt-2">
              Showing the first {MAX_VISIBLE} of {filtered.length}. Confirm
              these and the list refills.
            </p>
          )}

          <div className="mt-6">
            <Button
              onClick={handleImport}
              disabled={importing || counts.confirmed === 0}
            >
              {importing
                ? "Importing..."
                : `Import ${counts.confirmed} confirmed loan(s)`}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card>
          <p className="font-semibold text-green-700">{result.message}</p>
          {result.warnings?.length > 0 && (
            <ul className="text-sm text-amber-700 list-disc pl-5 mt-2">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {result.skipped?.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-red-600 font-medium">
                {result.skipped.length} skipped:
              </p>
              <ul className="text-sm text-gray-500 list-disc pl-5 max-h-64 overflow-y-auto">
                {result.skipped.map((s, i) => (
                  <li key={i}>{JSON.stringify(s)}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default BankLoanImportPage;
