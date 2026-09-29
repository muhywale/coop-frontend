import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBalancesByProduct } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import ExportButtons from "../components/ExportButtons";

const filterClass = "border border-gray-300 rounded-md px-3 py-2";

function MemberBalancesPage() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getBalancesByProduct().then((res) => {
      const memberMap = {};
      const productNames = new Set();

      res.data.forEach((row) => {
        productNames.add(row.product_name);
        if (!memberMap[row.member_id]) {
          memberMap[row.member_id] = {
            member_id: row.member_id,
            full_name: row.full_name,
            member_number: row.member_number,
          };
        }
        memberMap[row.member_id][row.product_name] = parseFloat(row.balance);
      });

      setRows(Object.values(memberMap));
      setColumns([...productNames]);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Loading balances...</p>;

  const q = search.trim().toLowerCase();
  const filteredRows = rows.filter(
    (r) =>
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      (r.member_number || "").toLowerCase().includes(q),
  );

  // Export data — built after state exists, inside the component
  const exportColumns = [
    { key: "member_number", label: "Member No." },
    { key: "full_name", label: "Name" },
    ...columns.map((col) => ({ key: col, label: col })),
  ];
  const exportData = filteredRows.map((r) => {
    const clean = {
      member_number: r.member_number || "",
      full_name: r.full_name,
    };
    columns.forEach((col) => {
      clean[col] = r[col] || 0;
    });
    return clean;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">
          Individual Balances
        </h2>
        <ExportButtons
          data={exportData}
          columns={exportColumns}
          fileName="individual-balances"
          title="Individual Member Balances"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          placeholder="Search by name or member number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${filterClass} flex-1 min-w-[200px]`}
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">
          Showing {filteredRows.length} of {rows.length}
        </span>
      </div>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Member No.</th>
          <th className="py-3 px-6">Name</th>
          {columns.map((col) => (
            <th key={col} className="py-3 px-6">
              {col}
            </th>
          ))}
        </TableHead>
        <tbody>
          {filteredRows.map((member) => (
            <TableRow key={member.member_id}>
              <td className="py-3 px-6 text-gray-600">
                {member.member_number || "—"}
              </td>
              <td className="py-3 px-6">
                <Link
                  to={`/members/${member.member_id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {member.full_name}
                </Link>
              </td>
              {columns.map((col) => (
                <td key={col} className="py-3 px-6">
                  ₦{(member[col] || 0).toLocaleString()}
                </td>
              ))}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default MemberBalancesPage;
