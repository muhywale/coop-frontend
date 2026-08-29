import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBalancesByProduct } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";

function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBalancesByProduct().then((res) => {
      const data = res.data;

      // build the pivot: one entry per member, with a balance per product name
      const memberMap = {};
      const productNames = new Set();

      data.forEach((row) => {
        productNames.add(row.product_name);
        if (!memberMap[row.member_id]) {
          memberMap[row.member_id] = {
            member_id: row.member_id,
            full_name: row.full_name,
          };
        }
        memberMap[row.member_id][row.product_name] = parseFloat(row.balance);
      });

      setRows(Object.values(memberMap));
      setProducts([...productNames]);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Member Balances Overview
      </h2>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Name</th>
          {products.map((p) => (
            <th key={p} className="py-3 px-6">
              {p}
            </th>
          ))}
        </TableHead>
        <tbody>
          {rows.map((member) => (
            <TableRow key={member.member_id}>
              <td className="py-3 px-6">
                <Link
                  to={`/members/${member.member_id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {member.member_number && (
                    <span className="text-gray-400 mr-1">
                      {member.member_number}
                    </span>
                  )}
                  {member.full_name}
                </Link>
              </td>
              {products.map((p) => (
                <td key={p} className="py-3 px-6">
                  ₦{(member[p] || 0).toLocaleString()}
                </td>
              ))}
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default DashboardPage;
