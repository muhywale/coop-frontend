import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  getProducts,
  bulkImportPayments,
  bulkImportLoans,
  bulkImportLoanRepayments,
  bulkImportOpeningBalances,
  bulkImportOpeningTrialBalance,
  bulkImportMembers,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function ExcelImportPage() {
  const [rawRows, setRawRows] = useState([]);
  const [excelColumns, setExcelColumns] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [products, setProducts] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [result, setResult] = useState(null);
  const [dateColumn, setDateColumn] = useState("");
  const [nameColumn, setNameColumn] = useState("");
  const [loanRepColumn, setLoanRepColumn] = useState("");
  const [loanAmountColumn, setLoanAmountColumn] = useState("");
  const [loanProductId, setLoanProductId] = useState("");
  const [repaymentProductId, setRepaymentProductId] = useState("");
  const [asAtDate, setAsAtDate] = useState("2025-12-31");
  const [openingColumnMap, setOpeningColumnMap] = useState({});
  const [tbCodeColumn, setTbCodeColumn] = useState("");
  const [tbDebitColumn, setTbDebitColumn] = useState("");
  const [tbCreditColumn, setTbCreditColumn] = useState("");
  const [tbAsAtDate, setTbAsAtDate] = useState("2025-12-31");
  const [memberNumberColumn, setMemberNumberColumn] = useState("");
  const [fileName, setFileName] = useState("");

  React.useEffect(() => {
    getProducts().then((res) => {
      setProducts(
        res.data.filter(
          (p) => p.category === "savings" || p.category === "other",
        ),
      );
      setLoanProducts(res.data.filter((p) => p.category === "loan"));
    });
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, {
        type: "binary",
        cellDates: true,
      });
      const sheet = wb.Sheets[wb.SheetNames[0]];

      // Read as raw array-of-arrays first, to locate the real header row
      const rawGrid = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
      });

      // Look for a row that has multiple non-empty cells AND contains something like "NAME"
      let headerRowIndex = rawGrid.findIndex((row) => {
        const nonEmptyCount = row.filter(
          (cell) => String(cell).trim() !== "",
        ).length;
        const hasNameLike = row.some((cell) => /name/i.test(String(cell)));
        return nonEmptyCount >= 3 && hasNameLike;
      });

      if (headerRowIndex === -1) {
        // fallback: just find the first row with 3+ non-empty cells
        headerRowIndex = rawGrid.findIndex(
          (row) => row.filter((c) => String(c).trim() !== "").length >= 3,
        );
      }
      if (headerRowIndex === -1) headerRowIndex = 0;

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        range: headerRowIndex,
      });

      if (json.length === 0) return;
      setExcelColumns(Object.keys(json[0]));
      setRawRows(json);
      setResult(null);
    };
    reader.readAsBinaryString(file);
  };

  const parseRowDate = (r) => {
    let parsedDate;
    try {
      let dateValue = dateColumn ? r[dateColumn] : null;
      parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (!parsedDate || isNaN(parsedDate.getTime())) parsedDate = new Date();
    } catch {
      parsedDate = new Date();
    }
    return parsedDate.toISOString().slice(0, 10);
  };

  const handleSubmit = async () => {
    const rows = rawRows.map((r) => ({
      date: parseRowDate(r),
      member_name: r[nameColumn],
      ...r,
    }));
    const batchSize = 300;
    let allSkipped = [];
    let totalPosted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      setResult({
        message: `Importing ${i + batch.length} of ${rows.length}...`,
        skipped: [],
      });
      try {
        const res = await bulkImportPayments({ rows: batch, columnMap });
        allSkipped = [...allSkipped, ...(res.data.skipped || [])];
        const match = res.data.message?.match(/\d+/);
        if (match) totalPosted += parseInt(match[0]);
      } catch (err) {
        allSkipped.push({
          batchStart: i,
          reason: err.response?.data?.error || err.message,
        });
      }
    }
    setResult({
      message: `Savings/Other import complete — ${totalPosted} entries posted`,
      skipped: allSkipped,
    });
  };

  const handleLoanImport = async () => {
    if (!loanProductId) {
      alert("Select which loan product these belong to first");
      return;
    }
    if (!loanAmountColumn) {
      alert("Select which column holds the loan amount");
      return;
    }
    const rows = rawRows.map((r) => ({
      date: parseRowDate(r),
      member_name: r[nameColumn],
      amount: r[loanAmountColumn],
    }));
    const batchSize = 300;
    let allSkipped = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      setResult({
        message: `Importing loans ${i + batch.length} of ${rows.length}...`,
        skipped: [],
      });
      try {
        const res = await bulkImportLoans({
          rows: batch,
          productId: loanProductId,
        });
        allSkipped = [...allSkipped, ...(res.data.skipped || [])];
      } catch (err) {
        allSkipped.push({
          batchStart: i,
          reason: err.response?.data?.error || err.message,
        });
      }
    }
    setResult({ message: "Loan import complete", skipped: allSkipped });
  };

  const handleLoanRepImport = async () => {
    if (!loanRepColumn) {
      alert("Select which column holds the loan repayment amount");
      return;
    }
    if (!repaymentProductId) {
      alert("Select which loan product these repayments are for");
      return;
    }
    const rows = rawRows.map((r) => ({
      date: parseRowDate(r),
      member_name: r[nameColumn],
      [loanRepColumn]: r[loanRepColumn],
    }));
    const batchSize = 300;
    let allSkipped = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      setResult({
        message: `Importing repayments ${i + batch.length} of ${rows.length}...`,
        skipped: [],
      });
      try {
        const res = await bulkImportLoanRepayments({
          rows: batch,
          loanRepColumn,
          productId: repaymentProductId,
        });
        allSkipped = [...allSkipped, ...(res.data.skipped || [])];
      } catch (err) {
        allSkipped.push({
          batchStart: i,
          reason: err.response?.data?.error || err.message,
        });
      }
    }
    setResult({
      message: "Loan repayment import complete",
      skipped: allSkipped,
    });
  };

  const handleOpeningBalancesImport = async () => {
    const rows = rawRows.map((r) => ({ member_name: r[nameColumn], ...r }));
    const batchSize = 300;
    let allSkipped = [];
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      setResult({
        message: `Importing opening balances ${i + batch.length} of ${rows.length}...`,
        skipped: [],
      });
      try {
        const res = await bulkImportOpeningBalances({
          rows: batch,
          columnMap: openingColumnMap,
          asAtDate,
        });
        allSkipped = [...allSkipped, ...(res.data.skipped || [])];
      } catch (err) {
        allSkipped.push({
          batchStart: i,
          reason: err.response?.data?.error || err.message,
        });
      }
    }
    setResult({
      message: "Opening balances import complete",
      skipped: allSkipped,
    });
  };

  const handleTrialBalanceImport = async () => {
    if (!tbCodeColumn || (!tbDebitColumn && !tbCreditColumn)) {
      alert(
        "Select the account code column and at least one of Debit/Credit columns",
      );
      return;
    }
    try {
      const res = await bulkImportOpeningTrialBalance({
        rows: rawRows,
        codeColumn: tbCodeColumn,
        debitColumn: tbDebitColumn,
        creditColumn: tbCreditColumn,
        asAtDate: tbAsAtDate,
      });
      setResult(res.data);
    } catch (err) {
      setResult({
        message: "Import failed",
        skipped: [{ reason: err.response?.data?.error || err.message }],
      });
    }
  };

  const handleMembersImport = async () => {
    if (!nameColumn) {
      alert("Select the Member Name column in step 2 first");
      return;
    }
    try {
      const res = await bulkImportMembers({
        rows: rawRows,
        nameColumn,
        memberNumberColumn: memberNumberColumn || null,
      });
      setResult(res.data);
    } catch (err) {
      setResult({
        message: "Import failed",
        skipped: [{ reason: err.response?.data?.error || err.message }],
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Import from Excel</h2>

      <Card>
        <h3 className="font-semibold mb-3">1. Upload File</h3>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        {fileName && (
          <p className="text-xs text-gray-500 mt-2">
            Loaded "{fileName}" — {rawRows.length} rows, {excelColumns.length}{" "}
            columns detected.
          </p>
        )}
      </Card>

      {excelColumns.length > 0 && (
        <>
          <Card>
            <h3 className="font-semibold mb-3">2. Identify Key Columns</h3>
            <p className="text-xs text-gray-500 mb-3">
              Detected columns: {excelColumns.join(", ")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">
                  Which column is the Date?
                </label>
                <select
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Which column is the Member Name?
                </label>
                <select
                  value={nameColumn}
                  onChange={(e) => setNameColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">3. Import / Update Members</h3>
            <p className="text-xs text-gray-500 mb-2">
              Creates new members, or fills in the passbook number for existing
              ones matched by name. Safe to run multiple times.
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500">
                Which column is the Member Number (passbook no.)?
              </label>
              <select
                value={memberNumberColumn}
                onChange={(e) => setMemberNumberColumn(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {excelColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleMembersImport}>
              Import / Update Members
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">
              4. Import Opening Trial Balance (Society-wide)
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              One row per account, with a code matching your Chart of Accounts,
              plus Debit and Credit columns. Must balance overall.
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500">As at date</label>
              <input
                type="date"
                value={tbAsAtDate}
                onChange={(e) => setTbAsAtDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500">
                  Account Code column
                </label>
                <select
                  value={tbCodeColumn}
                  onChange={(e) => setTbCodeColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Debit column</label>
                <select
                  value={tbDebitColumn}
                  onChange={(e) => setTbDebitColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Credit column</label>
                <select
                  value={tbCreditColumn}
                  onChange={(e) => setTbCreditColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleTrialBalanceImport}>
              Import Opening Trial Balance
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">
              5. Import Opening Balances (as at year-end)
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Brings forward each member's starting balance for any product.
              Only run this once per product per member.
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500">As at date</label>
              <input
                type="date"
                value={asAtDate}
                onChange={(e) => setAsAtDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Map each Excel column to a product:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {excelColumns.map((col) => (
                <div key={col}>
                  <label className="text-xs text-gray-500">{col}</label>
                  <select
                    value={openingColumnMap[col] || ""}
                    onChange={(e) =>
                      setOpeningColumnMap({
                        ...openingColumnMap,
                        [col]: e.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">Ignore</option>
                    <optgroup label="Savings / Other">
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Loans">
                      {loanProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
            <Button onClick={handleOpeningBalancesImport}>
              Import Opening Balances
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">6. Import Loans Granted</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">
                  Which column is the Loan Amount?
                </label>
                <select
                  value={loanAmountColumn}
                  onChange={(e) => setLoanAmountColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Which loan product are these?
                </label>
                <select
                  value={loanProductId}
                  onChange={(e) => setLoanProductId(e.target.value)}
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
            </div>
            <Button onClick={handleLoanImport}>Import Loans</Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">7. Import Loan Repayments</h3>
            <p className="text-xs text-gray-500 mb-2">
              Matches each repayment to the member's active loan of the selected
              product type.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">
                  Which column is the Loan Repayment amount?
                </label>
                <select
                  value={loanRepColumn}
                  onChange={(e) => setLoanRepColumn(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {excelColumns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Which loan product are these repayments for?
                </label>
                <select
                  value={repaymentProductId}
                  onChange={(e) => setRepaymentProductId(e.target.value)}
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
            </div>
            <Button onClick={handleLoanRepImport}>
              Import Loan Repayments
            </Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">
              8. Import Savings / Other Products
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Map each Excel column to a product. Leave unmapped columns as
              "Ignore":
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {excelColumns.map((col) => (
                <div key={col}>
                  <label className="text-xs text-gray-500">{col}</label>
                  <select
                    value={columnMap[col] || ""}
                    onChange={(e) =>
                      setColumnMap({ ...columnMap, [col]: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Ignore</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <Button onClick={handleSubmit}>Import Savings / Other</Button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">
              Preview ({rawRows.length} rows)
            </h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-100">
                    {excelColumns.map((c) => (
                      <th key={c} className="py-2 px-3 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {excelColumns.map((c) => (
                        <td key={c} className="py-2 px-3">
                          {String(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {result && (
        <Card>
          <p className="font-semibold text-green-700">{result.message}</p>
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

export default ExcelImportPage;
