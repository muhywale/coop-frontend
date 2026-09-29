import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMembers, deleteMember, createMemberLogin } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const filterClass = "border border-gray-300 rounded-md px-3 py-2";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loginFormFor, setLoginFormFor] = useState(null);
  const [loginData, setLoginData] = useState({
    username: "",
    temp_password: "",
  });
  const [message, setMessage] = useState("");

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

  const openLoginForm = (member) => {
    setLoginFormFor(member.id);
    setLoginData({
      username: `member${member.id}`,
      temp_password: String(member.member_number || member.id),
    });
    setMessage("");
  };

  const submitLogin = async (memberId) => {
    try {
      await createMemberLogin({ member_id: memberId, ...loginData });
      setMessage(
        `Login created — username: ${loginData.username}, temp password: ${loginData.temp_password}`,
      );
      setLoginFormFor(null);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create login");
    }
  };

  if (loading) return <p className="text-gray-500">Loading members...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const q = search.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (
      q &&
      !(
        m.full_name?.toLowerCase().includes(q) ||
        (m.member_number || "").toLowerCase().includes(q) ||
        (m.phone || "").includes(q)
      )
    )
      return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      {message && (
        <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-md px-4 py-2 mb-4">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Search by name, member number, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${filterClass} flex-1 min-w-[200px]`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={filterClass}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          Showing {filteredMembers.length} of {members.length}
        </span>
      </div>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Member No.</th>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Phone</th>
          <th className="py-3 px-6">Status</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {filteredMembers.map((member) => (
            <React.Fragment key={member.id}>
              <TableRow>
                <td className="py-3 px-6 text-gray-600">
                  {member.member_number || "—"}
                </td>
                <td className="py-3 px-6">
                  <Link
                    to={`/members/${member.id}`}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    {member.full_name}
                  </Link>
                </td>
                <td className="py-3 px-6 text-gray-600">{member.phone}</td>
                <td className="py-3 px-6">
                  <Badge status={member.status} />
                </td>
                <td className="py-3 px-6">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openLoginForm(member)}
                    >
                      Create Login
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(member.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </TableRow>
              {loginFormFor === member.id && (
                <tr>
                  <td colSpan="5" className="bg-gray-50 px-6 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="text-xs text-gray-500">
                          Username
                        </label>
                        <input
                          value={loginData.username}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              username: e.target.value,
                            })
                          }
                          className="block border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Temporary Password
                        </label>
                        <input
                          value={loginData.temp_password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              temp_password: e.target.value,
                            })
                          }
                          className="block border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <Button onClick={() => submitLogin(member.id)}>
                        Save Login
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setLoginFormFor(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default MemberList;
