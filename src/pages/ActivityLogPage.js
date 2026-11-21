import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { getActivity, getActivityUsers } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "border border-gray-300 rounded-md px-3 py-2 text-sm";
const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";

// A short line saying what was touched
const touched = (r) => {
  const d = r.details || {};
  const parts = [];
  if (r.member_name)
    parts.push(
      `${r.member_number ? `${r.member_number} — ` : ""}${r.member_name}`,
    );
  if (r.product_name) parts.push(r.product_name);
  if (
    d.amount !== undefined &&
    d.amount !== "" &&
    !Number.isNaN(Number(d.amount))
  )
    parts.push(money(d.amount));
  if (d.username && !/^Logged|^Failed|^Asked/.test(r.summary))
    parts.push(`user ${d.username}`);
  if (d.rows) parts.push(`${d.rows} rows`);
  Object.keys(d)
    .filter((k) => k.endsWith("_count"))
    .forEach((k) => parts.push(`${d[k]} ${k.replace(/_count$/, "")}`));
  return parts.join(" · ");
};

function ActivityLogPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "super_admin";

  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({ username: "", from: "", to: "", q: "" });
  const [applied, setApplied] = useState(form);
  const [all, setAll] = useState(false);
  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const query = useCallback(
    (extra = {}) => ({ ...applied, all: all ? "1" : "", tz, ...extra }),
    [applied, all],
  );

  useEffect(() => {
    getActivityUsers()
      .then((res) => setPeople(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    getActivity(query())
      .then((res) => {
        setRows(res.data.rows);
        setHasMore(res.data.has_more);
      })
      .catch(() => setError("Couldn't load the activity log."))
      .finally(() => setLoading(false));
  }, [query]);

  const loadMore = async () => {
    setBusy("more");
    try {
      const res = await getActivity(
        query({ before_id: rows[rows.length - 1].id }),
      );
      setRows((current) => [...current, ...res.data.rows]);
      setHasMore(res.data.has_more);
    } catch {
      setError("Couldn't load more.");
    } finally {
      setBusy("");
    }
  };

  const download = async () => {
    setBusy("export");
    try {
      const res = await getActivity(query({ export: "1" }));
      const sheet = XLSX.utils.aoa_to_sheet([
        [
          "When",
          "Who",
          "Role",
          "What",
          "Touched",
          "Technical",
          "Address",
          ...(isSuper && all ? ["Cooperative"] : []),
        ],
        ...res.data.rows.map((r) => [
          new Date(r.created_at).toLocaleString(),
          r.username,
          r.role || "",
          r.summary,
          touched(r),
          r.action,
          r.ip || "",
          ...(isSuper && all ? [r.cooperative_name || ""] : []),
        ]),
      ]);
      sheet["!cols"] = [
        { wch: 20 },
        { wch: 18 },
        { wch: 12 },
        { wch: 38 },
        { wch: 40 },
        { wch: 34 },
        { wch: 16 },
      ];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Activity log");
      XLSX.writeFile(book, "activity-log.xlsx");
    } catch {
      setError("Couldn't prepare the download.");
    } finally {
      setBusy("");
    }
  };

  const apply = (e) => {
    e.preventDefault();
    setApplied(form);
  };

  const reset = () => {
    const empty = { username: "", from: "", to: "", q: "" };
    setForm(empty);
    setApplied(empty);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <Button
          variant="secondary"
          onClick={download}
          disabled={busy === "export" || rows.length === 0}
        >
          {busy === "export" ? "Preparing..." : "Download Excel"}
        </Button>
      </div>

      <Card>
        <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-gray-500 block">Who</label>
            <select
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={`${inputClass} min-w-[160px]`}
            >
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p.username} value={p.username}>
                  {p.username} ({p.n})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block">From</label>
            <input
              type="date"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">To</label>
            <input
              type="date"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 block">Search</label>
            <input
              value={form.q}
              onChange={(e) => setForm({ ...form, q: e.target.value })}
              placeholder="e.g. loan, password, a member's name"
              className={`${inputClass} w-full`}
            />
          </div>
          <Button type="submit">Apply</Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Clear
          </Button>
        </form>
        {isSuper && (
          <label className="flex items-center gap-2 text-sm text-gray-600 mt-3">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => setAll(e.target.checked)}
            />
            Show all cooperatives
          </label>
        )}
      </Card>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && rows.length === 0 && !error && (
        <p className="text-gray-500">Nothing recorded for these filters yet.</p>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-200 bg-gray-50">
                <th className="py-2 px-4 whitespace-nowrap">When</th>
                <th className="py-2 px-4">Who</th>
                <th className="py-2 px-4">What</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const failed = r.summary === "Failed login attempt";
                const line = touched(r);
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-50 align-top ${failed ? "bg-red-50" : ""}`}
                  >
                    <td className="py-2 px-4 whitespace-nowrap text-gray-600">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="font-medium">{r.username}</span>
                      {r.role && (
                        <span className="ml-2 text-[10px] uppercase bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {r.role.replace("_", " ")}
                        </span>
                      )}
                      {isSuper && all && r.cooperative_name && (
                        <p className="text-xs text-gray-400">
                          {r.cooperative_name}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <p
                        className={
                          failed ? "text-red-700 font-medium" : "font-medium"
                        }
                      >
                        {r.summary}
                      </p>
                      {line && <p className="text-gray-600">{line}</p>}
                      <p className="text-xs text-gray-400" title={r.ip || ""}>
                        {r.action}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <Button
          variant="secondary"
          onClick={loadMore}
          disabled={busy === "more"}
        >
          {busy === "more" ? "Loading..." : "Load more"}
        </Button>
      )}

      <p className="text-xs text-gray-500">
        Records who made each change, when, and from which address. It doesn't
        store the old values of what was changed. Entries can't be edited or
        deleted from the app.
      </p>
    </div>
  );
}

export default ActivityLogPage;
