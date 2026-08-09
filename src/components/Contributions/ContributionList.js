import React, { useState, useEffect } from "react";
import { getContributions } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";

function ContributionList() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContributions()
      .then((res) => setContributions(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading contributions...</p>;

  return (
    <Table>
      <TableHead>
        <th className="py-3 px-6">Member</th>
        <th className="py-3 px-6">Amount</th>
        <th className="py-3 px-6">Type</th>
        <th className="py-3 px-6">Date</th>
        <th className="py-3 px-6">Notes</th>
      </TableHead>
      <tbody>
        {contributions.map((c) => (
          <TableRow key={c.id}>
            <td className="py-3 px-6 font-medium">{c.full_name}</td>
            <td
              className={`py-3 px-6 font-medium ${c.type === "withdrawal" ? "text-red-600" : "text-green-600"}`}
            >
              {c.type === "withdrawal" ? "-" : "+"}₦
              {parseFloat(c.amount).toLocaleString()}
            </td>
            <td className="py-3 px-6 capitalize text-gray-600">{c.type}</td>
            <td className="py-3 px-6 text-gray-600">
              {new Date(c.contribution_date).toLocaleDateString()}
            </td>
            <td className="py-3 px-6 text-gray-500">{c.notes}</td>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

export default ContributionList;
