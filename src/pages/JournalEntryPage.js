import React, { useState, useEffect } from "react";
import { getAccounts, createJournalEntry } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { toLocalDateString } from "../utils/dateHelper";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function JournalEntryPage() {
  const [accounts, setAccounts] = useState([]);
  const [entryDate, setEntryDate] = useState(toLocalDateString(new Date()));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    { account_id: "", debit: "", credit: "" },
    { account_id: "", debit: "", credit: "" },
  ]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAccounts().then((res) => setAccounts(res.data));
  }, []);

  const updateLine = (i, field, value) => {
    const updated = [...lines];
    updated[i][field] = value;
    setLines(updated);
  };

  const addLine = () =>
    setLines([...lines, { account_id: "", debit: "", credit: "" }]);

  const totalDebit = lines.reduce(
    (sum, l) => sum + (parseFloat(l.debit) || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (sum, l) => sum + (parseFloat(l.credit) || 0),
    0,
  );
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createJournalEntry({ entry_date: entryDate, description, lines });
      setMessage("Journal entry recorded.");
      setLines([
        { account_id: "", debit: "", credit: "" },
        { account_id: "", debit: "", credit: "" },
      ]);
      setDescription("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to record entry");
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">New Journal Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Description (e.g. Rent for August)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={line.account_id}
              onChange={(e) => updateLine(i, "account_id", e.target.value)}
              required
              className={inputClass}
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
              step="0.01"
              placeholder="Debit"
              value={line.debit}
              onChange={(e) => updateLine(i, "debit", e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Credit"
              value={line.credit}
              onChange={(e) => updateLine(i, "credit", e.target.value)}
              className={inputClass}
            />
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={addLine}>
          + Add Line
        </Button>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <p
            className={`text-sm font-medium ${balanced ? "text-green-600" : "text-red-600"}`}
          >
            Debit: ₦{totalDebit.toLocaleString()} — Credit: ₦
            {totalCredit.toLocaleString()}
            {balanced ? " ✓ Balanced" : " — must balance"}
          </p>
          <Button type="submit" disabled={!balanced}>
            Record Entry
          </Button>
        </div>
        {message && <p className="text-sm text-primary-700">{message}</p>}
      </form>
    </Card>
  );
}

export default JournalEntryPage;
