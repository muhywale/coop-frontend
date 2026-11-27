import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { getMemberDirectory } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "border border-gray-300 rounded-md px-3 py-2 text-sm";
const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const asDate = (s) => new Date(`${s}T00:00:00`);

// How far away a retirement date is
const retireInfo = (dateStr) => {
  if (!dateStr) return null;
  const now = today();
  const target = asDate(dateStr);
  if (target < now) return { state: "past", text: "Retired", months: null };

  let months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  if (target.getDate() < now.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (rest > 0) parts.push(`${rest} mth${rest === 1 ? "" : "s"}`);
  return {
    state: months < 6 ? "soon" : months < 12 ? "near" : "later",
    text: `in ${parts.join(" ") || "under a month"}`,
    months,
  };
};

// True when the date falls between today and n months from now
const within = (dateStr, n) => {
  const now = today();
  const limit = new Date(now.getFullYear(), now.getMonth() + n, now.getDate());
  const t = asDate(dateStr);
  return t >= now && t <= limit;
};

const MISSING = [
  { key: "phone", label: "Phone", test: (m) => !m.phone },
  { key: "email", label: "Email", test: (m) => !m.email },
  { key: "address", label: "Address", test: (m) => !m.address },
  {
    key: "kin",
    label: "Next of kin",
    test: (m) => !m.next_of_kin_name || !m.next_of_kin_phone,
  },
  { key: "bank", label: "Bank account", test: (m) => !m.bank_account_number },
  { key: "joined", label: "Date joined", test: (m) => !m.date_joined },
  { key: "retire", label: "Retirement date", test: (m) => !m.retirement_date },
];

const nullsLast = (a, b) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
};

const SORTS = {
  name: (a, b) => a.full_name.localeCompare(b.full_name),
  number: (a, b) =>
    (a.member_number || "").localeCompare(b.member_number || "", undefined, {
      numeric: true,
    }),
  retire: (a, b) => nullsLast(a.retirement_date, b.retirement_date),
  joined: (a, b) => nullsLast(a.date_joined, b.date_joined),
};

const dash = <span className="text-gray-300">—</span>;

function MemberDirectoryPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [retire, setRetire] = useState("all");
  const [missing, setMissing] = useState("");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    getMemberDirectory()
      .then((res) => setMembers(res.data))
      .catch(() => setError("Couldn't load the directory."))
      .finally(() => setLoading(false));
  }, []);

  // Members matching the Active/Inactive choice, and how many of them lack each detail
  const base = useMemo(
    () =>
      members.filter((m) =>
        status === "all"
          ? true
          : status === "active"
            ? m.status === "active"
            : m.status !== "active",
      ),
    [members, status],
  );
  const missingCounts = useMemo(() => {
    const counts = {};
    MISSING.forEach((f) => {
      counts[f.key] = base.filter(f.test).length;
    });
    return counts;
  }, [base]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const missingTest = MISSING.find((f) => f.key === missing)?.test;

    return base
      .filter((m) => {
        if (q) {
          const text = [
            m.full_name,
            m.member_number,
            m.phone,
            m.email,
            m.address,
            m.department,
            m.occupation,
            m.next_of_kin_name,
            m.bank_account_number,
          ]
            .join(" ")
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        if (retire === "none" && m.retirement_date) return false;
        if (
          retire === "retired" &&
          !(m.retirement_date && asDate(m.retirement_date) < today())
        )
          return false;
        if (
          ["6", "12", "24"].includes(retire) &&
          !(m.retirement_date && within(m.retirement_date, Number(retire)))
        )
          return false;
        if (missingTest && !missingTest(m)) return false;
        return true;
      })
      .sort(SORTS[sort]);
  }, [base, search, retire, missing, sort]);

  const clearFilters = () => {
    setSearch("");
    setRetire("all");
    setMissing("");
    setSort("name");
  };

  const download = () => {
    const head = [
      "No.",
      "Name",
      "Status",
      "Phone",
      "Email",
      "Address",
      "Next of kin",
      "Next of kin phone",
      "Relationship",
      "Occupation",
      "Department",
      "Date joined",
      "Retirement date",
      "Months to retirement",
      "Bank",
      "Account number",
      "Loans owed",
    ];
    const body = rows.map((m) => {
      const info = retireInfo(m.retirement_date);
      return [
        m.member_number || "",
        m.full_name,
        m.status,
        m.phone || "",
        m.email || "",
        m.address || "",
        m.next_of_kin_name || "",
        m.next_of_kin_phone || "",
        m.next_of_kin_relationship || "",
        m.occupation || "",
        m.department || "",
        m.date_joined || "",
        m.retirement_date || "",
        info ? (info.state === "past" ? "Retired" : info.months) : "",
        m.bank_name || "",
        m.bank_account_number || "",
        m.loans_owed || 0,
      ];
    });

    const sheet = XLSX.utils.aoa_to_sheet([
      [user?.cooperative_name || "Member directory"],
      [
        `Member directory, ${new Date().toLocaleDateString()}. ${rows.length} members.`,
      ],
      [],
      head,
      ...body,
    ]);
    // Account numbers stay as text, and money shows with two decimals
    body.forEach((_, i) => {
      const accountCell = sheet[XLSX.utils.encode_cell({ r: 4 + i, c: 15 })];
      if (accountCell) {
        accountCell.t = "s";
        accountCell.z = "@";
      }
      const owedCell = sheet[XLSX.utils.encode_cell({ r: 4 + i, c: 16 })];
      if (owedCell && owedCell.t === "n") owedCell.z = "#,##0.00";
    });
    sheet["!cols"] = [
      { wch: 9 },
      { wch: 30 },
      { wch: 10 },
      { wch: 16 },
      { wch: 28 },
      { wch: 40 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
    ];

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Directory");
    XLSX.writeFile(book, "member-directory.xlsx");
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const filtersOn = search || retire !== "all" || missing || sort !== "name";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Member Directory</h2>
        <Button
          variant="secondary"
          onClick={download}
          disabled={rows.length === 0}
        >
          Download Excel
        </Button>
      </div>

      <Card>
        <p className="text-xs text-gray-500 mb-2">
          Members who are missing a detail (click one to show only those):
        </p>
        <div className="flex flex-wrap gap-2">
          {MISSING.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setMissing(missing === f.key ? "" : f.key)}
              className={`text-xs rounded-full px-3 py-1 border transition ${
                missing === f.key
                  ? "bg-primary-500 text-white border-primary-500"
                  : missingCounts[f.key] > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {f.label} {missingCounts[f.key]}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <input
          placeholder="Search name, number, phone, email, address, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1 min-w-[220px]`}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="active">Active members</option>
          <option value="inactive">Inactive members</option>
          <option value="all">All members</option>
        </select>
        <select
          value={retire}
          onChange={(e) => setRetire(e.target.value)}
          className={inputClass}
        >
          <option value="all">Any retirement date</option>
          <option value="6">Retiring within 6 months</option>
          <option value="12">Retiring within 12 months</option>
          <option value="24">Retiring within 24 months</option>
          <option value="retired">Already retired</option>
          <option value="none">No retirement date</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={inputClass}
        >
          <option value="name">Sort by name</option>
          <option value="number">Sort by member number</option>
          <option value="retire">Sort by retirement (soonest first)</option>
          <option value="joined">Sort by date joined</option>
        </select>
        {filtersOn && (
          <Button variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Showing {rows.length} of {base.length} members.
      </p>

      {rows.length === 0 ? (
        <p className="text-gray-500">No members match.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[68vh]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="py-2 px-3">Member</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3">Address</th>
                <th className="py-2 px-3">Next of kin</th>
                <th className="py-2 px-3">Work</th>
                <th className="py-2 px-3 whitespace-nowrap">Joined</th>
                <th className="py-2 px-3 whitespace-nowrap">Retires</th>
                <th className="py-2 px-3">Bank</th>
                <th className="py-2 px-3 text-right whitespace-nowrap">
                  Loans owed
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const info = retireInfo(m.retirement_date);
                const tint =
                  info?.state === "soon"
                    ? "bg-amber-50"
                    : info?.state === "past"
                      ? "bg-gray-50"
                      : "";
                return (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 align-top hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      <Link
                        to={`/members/${m.id}/details`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {m.full_name}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {m.member_number
                          ? `No. ${m.member_number}`
                          : "No number"}
                        {m.status !== "active" ? " · inactive" : ""}
                      </p>
                    </td>
                    <td className="py-2 px-3">
                      <p className="whitespace-nowrap">{m.phone || dash}</p>
                      <p className="text-xs text-gray-500">{m.email || ""}</p>
                    </td>
                    <td className="py-2 px-3 min-w-[160px] max-w-[240px]">
                      {m.address || dash}
                    </td>
                    <td className="py-2 px-3">
                      {m.next_of_kin_name ? (
                        <>
                          <p>
                            {m.next_of_kin_name}
                            {m.next_of_kin_relationship
                              ? ` (${m.next_of_kin_relationship})`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {m.next_of_kin_phone || "no phone"}
                          </p>
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {m.occupation || m.department ? (
                        <>
                          <p>{m.occupation || ""}</p>
                          <p className="text-xs text-gray-500">
                            {m.department || ""}
                          </p>
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-gray-600">
                      {m.date_joined
                        ? asDate(m.date_joined).toLocaleDateString()
                        : dash}
                    </td>
                    <td className={`py-2 px-3 whitespace-nowrap ${tint}`}>
                      {m.retirement_date ? (
                        <>
                          <p>
                            {asDate(m.retirement_date).toLocaleDateString()}
                          </p>
                          <p
                            className={`text-xs ${info.state === "soon" ? "text-amber-700 font-medium" : "text-gray-500"}`}
                          >
                            {info.text}
                          </p>
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {m.bank_account_number ? (
                        <>
                          <p className="whitespace-nowrap">
                            {m.bank_account_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {m.bank_name || ""}
                          </p>
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {m.loans_owed > 0 ? (
                        <span className="font-medium text-red-600">
                          {money(m.loans_owed)}
                        </span>
                      ) : (
                        dash
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MemberDirectoryPage;
