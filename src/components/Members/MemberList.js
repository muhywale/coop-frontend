import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMembers, deleteMember, createMemberLogin } from "../../api/api";
import { Table, TableHead, TableRow } from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginFormFor, setLoginFormFor] = useState(null); // member id currently getting a login
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
      temp_password: String(member.id),
    });
    setMessage("");
  };

  const submitLogin = async (memberId) => {
    console.log("Save Login clicked for member:", memberId, loginData);
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

  return (
    <div>
      {message && (
        <p className="text-sm text-primary-700 bg-primary-50 border border-primary-200 rounded-md px-4 py-2 mb-4">
          {message}
        </p>
      )}
      <Table>
        <TableHead>
          <th className="py-3 px-6">Member No.</th>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Phone</th>
          <th className="py-3 px-6">Status</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {members.map((member) => (
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
                <td className="py-3 px-6 flex gap-2">
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
                </td>
              </TableRow>
              {loginFormFor === member.id && (
                <tr>
                  <td colSpan="4" className="bg-gray-50 px-6 py-4">
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
