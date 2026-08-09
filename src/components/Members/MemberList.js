import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMembers, deleteMember } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await getMembers();
      setMembers(response.data);
    } catch (err) {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    await deleteMember(id);
    setMembers(members.filter((m) => m.id !== id));
  };

  if (loading) return <p className="text-gray-500">Loading members...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <Table>
      <TableHead>
        <th className="py-3 px-6">Name</th>
        <th className="py-3 px-6">Email</th>
        <th className="py-3 px-6">Phone</th>
        <th className="py-3 px-6">Status</th>
        <th className="py-3 px-6">Actions</th>
      </TableHead>
      <tbody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <td className="py-3 px-6">
              <Link
                to={`/members/${member.id}`}
                className="text-primary-600 hover:underline font-medium"
              >
                {member.full_name}
              </Link>
            </td>
            <td className="py-3 px-6 text-gray-600">{member.email}</td>
            <td className="py-3 px-6 text-gray-600">{member.phone}</td>
            <td className="py-3 px-6">
              <Badge status={member.status} />
            </td>
            <td className="py-3 px-6">
              <Button variant="danger" onClick={() => handleDelete(member.id)}>
                Delete
              </Button>
            </td>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

export default MemberList;
