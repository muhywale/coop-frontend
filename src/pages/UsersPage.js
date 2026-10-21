import React, { useState, useEffect } from "react";
import {
  getUsers,
  createUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import MemberSearchSelect from "../components/MemberSearchSelect";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
const emptyForm = () => ({
  member_id: "",
  username: "",
  temp_password: "",
  role: "member",
});

function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const fetchUsers = async () => {
    const res = await getUsers();
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers().catch(() => {
      setMessage({ text: "Failed to load users", ok: false });
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await createUser(form);
      setMessage({
        text: `Login created. Username: ${form.username} · Temporary password: ${form.temp_password}. They must change it at first login.`,
        ok: true,
      });
      setForm(emptyForm());
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to create login",
        ok: false,
      });
    }
  };

  const handleRoleChange = async (u, role) => {
    setMessage(null);
    try {
      const res = await updateUserRole(u.id, role);
      setMessage({ text: res.data.message, ok: true });
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to change role",
        ok: false,
      });
    }
  };

  const handleReset = async (u) => {
    setMessage(null);
    try {
      const res = await resetUserPassword(u.id, resetPassword);
      setMessage({
        text: `${res.data.message} Temporary password: ${resetPassword}`,
        ok: true,
      });
      setResetFor(null);
      setResetPassword("");
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to reset password",
        ok: false,
      });
    }
  };

  const handleDelete = async (u) => {
    if (
      !window.confirm(
        `Remove the login for ${u.username}? They will lose access immediately. The member record is kept.`,
      )
    )
      return;
    setMessage(null);
    try {
      const res = await deleteUser(u.id);
      setMessage({ text: res.data.message, ok: true });
      fetchUsers();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to remove login",
        ok: false,
      });
    }
  };

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  const q = search.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.member_number || "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Users</h2>

      <Card>
        <h3 className="font-semibold mb-1">Create a login</h3>
        <p className="text-xs text-gray-500 mb-4">
          Every login belongs to a member. For someone who isn't a member yet,
          add them on the Members page first.
        </p>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500">Member</label>
            <MemberSearchSelect
              value={form.member_id}
              onChange={(id) => setForm({ ...form, member_id: id })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Temporary password</label>
            <input
              value={form.temp_password}
              onChange={(e) =>
                setForm({ ...form, temp_password: e.target.value })
              }
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              <option value="member">Member (sees own profile)</option>
              <option value="admin">Admin (full access)</option>
            </select>
          </div>
          <Button type="submit" className="w-fit">
            Create login
          </Button>
        </form>
      </Card>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}

      <input
        placeholder="Search by username, name or member number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputClass} max-w-md`}
      />

      <Table>
        <TableHead>
          <th className="py-3 px-6">Member</th>
          <th className="py-3 px-6">Username</th>
          <th className="py-3 px-6">Role</th>
          <th className="py-3 px-6">Status</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {visible.map((u) => {
            const isMe = Number(u.id) === Number(me?.id);
            const locked = u.role === "super_admin";
            return (
              <React.Fragment key={u.id}>
                <TableRow>
                  <td className="py-3 px-6">
                    {u.full_name
                      ? `${u.member_number ? u.member_number + " — " : ""}${u.full_name}`
                      : "—"}
                  </td>
                  <td className="py-3 px-6 font-medium">
                    {u.username}
                    {isMe && (
                      <span className="ml-2 text-xs text-gray-400">(you)</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {locked ? (
                      <span className="text-xs text-gray-500">
                        Platform admin
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm disabled:bg-gray-100"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-6 text-sm">
                    {u.must_change_password ? (
                      <span className="text-amber-700">
                        Must change password
                      </span>
                    ) : (
                      <span className="text-gray-500">Active</span>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    {!locked && !isMe && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setResetFor(resetFor === u.id ? null : u.id);
                            setResetPassword("");
                          }}
                        >
                          Reset password
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(u)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                </TableRow>
                {resetFor === u.id && (
                  <tr>
                    <td colSpan="5" className="bg-gray-50 px-6 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="text-xs text-gray-500">
                            New temporary password for {u.username}
                          </label>
                          <input
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            className="block border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                        <Button
                          onClick={() => handleReset(u)}
                          disabled={resetPassword.length < 6}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setResetFor(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default UsersPage;
