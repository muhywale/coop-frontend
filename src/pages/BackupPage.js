import React, { useState } from "react";
import * as XLSX from "xlsx";
import { getBackupExport } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function BackupPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const isSuperAdmin = user?.role === "super_admin";

  const run = async (scope, format) => {
    setBusy(`${scope}-${format}`);
    setMessage(null);
    try {
      const res = await getBackupExport(scope);
      const data = res.data;
      const stamp = toLocalDateString(new Date());
      const label = scope === "all" ? "all-cooperatives" : "my-cooperative";

      if (format === "json") {
        downloadBlob(
          new Blob([JSON.stringify(data)], { type: "application/json" }),
          `coop-backup-${label}-${stamp}.json`,
        );
      } else {
        const wb = XLSX.utils.book_new();
        Object.entries(data.tables).forEach(([name, rows]) => {
          XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.json_to_sheet(rows.length ? rows : [{}]),
            name.slice(0, 31),
          );
        });
        XLSX.writeFile(wb, `coop-backup-${label}-${stamp}.xlsx`);
      }

      setMessage({
        ok: true,
        text: "Backup downloaded.",
        counts: data.counts,
        warnings: data.warnings,
      });
    } catch (err) {
      setMessage({
        ok: false,
        text: err.response?.data?.error || "Backup failed",
      });
    } finally {
      setBusy("");
    }
  };

  const button = (scope, format, label) => (
    <Button onClick={() => run(scope, format)} disabled={!!busy}>
      {busy === `${scope}-${format}` ? "Preparing..." : label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Backup</h2>

      <Card>
        <h3 className="font-semibold mb-1">Your cooperative's data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Members, products, chart of accounts, payments, loans, repayments and
          the full ledger. Passwords are not included. Store the file somewhere
          safe, because it contains your members' financial records.
        </p>
        <div className="flex flex-wrap gap-3">
          {button("cooperative", "json", "Download backup (JSON)")}
          {button("cooperative", "xlsx", "Download as Excel workbook")}
        </div>
      </Card>

      {isSuperAdmin && (
        <Card>
          <h3 className="font-semibold mb-1">
            Every cooperative on the platform
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Platform admin only. One file covering all cooperatives. Take this
            regularly, and also a pgAdmin database backup.
          </p>
          <div className="flex flex-wrap gap-3">
            {button("all", "json", "Download full backup (JSON)")}
            {button("all", "xlsx", "Download full backup (Excel)")}
          </div>
        </Card>
      )}

      {message && (
        <div
          className={`text-sm rounded-md px-4 py-3 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          <p className="font-medium">{message.text}</p>
          {message.counts && (
            <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 text-xs">
              {Object.entries(message.counts).map(([name, n]) => (
                <li key={name}>
                  {name}: {n.toLocaleString()}
                </li>
              ))}
            </ul>
          )}
          {message.warnings?.length > 0 && (
            <ul className="list-disc pl-5 mt-2">
              {message.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default BackupPage;
