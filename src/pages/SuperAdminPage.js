import React, { useState, useEffect } from "react";
import {
  getCooperatives,
  createCooperative,
  getCooperativeAdmins,
  resetCooperativeAdminPassword,
  dismissAdminResetRequest,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Table, TableHead, TableRow } from "../components/ui/Table";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function SuperAdminPage() {
  const [cooperatives, setCooperatives] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    admin_full_name: "",
    admin_username: "",
    admin_password: "",
  });
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState(null);
  const [search, setSearch] = useState("");

  const fetchCooperatives = () =>
    getCooperatives().then((res) => setCooperatives(res.data));
  const fetchAdmins = () =>
    getCooperativeAdmins()
      .then((res) => setAdmins(res.data))
      .catch(() => {});

  useEffect(() => {
    fetchCooperatives();
    fetchAdmins();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await createCooperative(formData);
      setMessage(res.data.message);
      setFormData({
        name: "",
        admin_full_name: "",
        admin_username: "",
        admin_password: "",
      });
      fetchCooperatives();
      fetchAdmins();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create cooperative");
    }
  };

  const handleReset = async (a) => {
    const who = a.full_name || a.username;
    if (
      !window.confirm(
        `Reset the password for ${who} (${a.cooperative_name})?\n\nOnly continue once you've confirmed it's really them (a phone call or in person). They will be signed out everywhere.`,
      )
    )
      return;

    setResetMessage(null);
    try {
      const res = await resetCooperativeAdminPassword(a.id);
      setResetMessage({
        text: `${res.data.message} Temporary password for ${res.data.username}: ${res.data.temp_password}`,
        ok: true,
      });
      fetchAdmins();
    } catch (err) {
      setResetMessage({
        text: err.response?.data?.error || "Failed to reset the password",
        ok: false,
      });
    }
  };

  const handleDismiss = async (a) => {
    try {
      await dismissAdminResetRequest(a.id);
      fetchAdmins();
    } catch (err) {
      setResetMessage({
        text: err.response?.data?.error || "Failed to dismiss the request",
        ok: false,
      });
    }
  };

  const q = search.trim().toLowerCase();
  const visibleAdmins = admins.filter(
    (a) =>
      !q ||
      a.username.toLowerCase().includes(q) ||
      (a.full_name || "").toLowerCase().includes(q) ||
      a.cooperative_name.toLowerCase().includes(q),
  );
  const pendingCount = admins.filter((a) => a.requested_at).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Super Admin — Cooperatives</h2>

      <Card>
        <h3 className="font-semibold mb-4">Onboard New Cooperative</h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            name="name"
            placeholder="Cooperative name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="admin_full_name"
            placeholder="Admin's full name"
            value={formData.admin_full_name}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="admin_username"
            placeholder="Admin username"
            value={formData.admin_username}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="admin_password"
            type="password"
            placeholder="Admin password"
            value={formData.admin_password}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <Button type="submit" className="sm:col-span-2 w-fit">
            Create Cooperative
          </Button>
        </form>
        {message && <p className="text-sm mt-3 text-primary-700">{message}</p>}
      </Card>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Members</th>
          <th className="py-3 px-6">Created</th>
          <th className="py-3 px-6">Status</th>
        </TableHead>
        <tbody>
          {cooperatives.map((c) => (
            <TableRow key={c.id}>
              <td className="py-3 px-6 font-medium">{c.name}</td>
              <td className="py-3 px-6">{c.member_count}</td>
              <td className="py-3 px-6 text-gray-500">
                {new Date(c.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-6">{c.active ? "Active" : "Inactive"}</td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <Card>
        <h3 className="font-semibold mb-1">
          Cooperative admins: password reset
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {pendingCount} asked
            </span>
          )}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          For when an admin is locked out and no one else in their cooperative
          can reset it. Confirm it's really them (a call or in person) before
          resetting. Their own cooperative's members are reset by that
          cooperative's admin.
        </p>

        {resetMessage && (
          <p
            className={`text-sm rounded-md px-4 py-2 border mb-4 ${resetMessage.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
          >
            {resetMessage.text}
          </p>
        )}

        <input
          placeholder="Search by cooperative, name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-md mb-4`}
        />

        {visibleAdmins.length === 0 ? (
          <p className="text-sm text-gray-500">No admins found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                  <th className="py-2 px-3">Cooperative</th>
                  <th className="py-2 px-3">Admin</th>
                  <th className="py-2 px-3">Username</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAdmins.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-gray-50 ${a.requested_at ? "bg-amber-50" : ""}`}
                  >
                    <td className="py-2 px-3 font-medium">
                      {a.cooperative_name}
                    </td>
                    <td className="py-2 px-3">
                      {a.full_name
                        ? `${a.member_number ? a.member_number + " — " : ""}${a.full_name}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3">{a.username}</td>
                    <td className="py-2 px-3 text-xs">
                      {a.requested_at ? (
                        <span className="text-amber-700">
                          Asked for a reset{" "}
                          {new Date(a.requested_at).toLocaleString()}
                          {a.request_note ? ` · "${a.request_note}"` : ""}
                        </span>
                      ) : a.must_change_password ? (
                        <span className="text-gray-500">
                          Must change password
                        </span>
                      ) : (
                        <span className="text-gray-400">Active</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleReset(a)}
                        >
                          Reset &amp; generate
                        </Button>
                        {a.requested_at && (
                          <Button
                            variant="secondary"
                            onClick={() => handleDismiss(a)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SuperAdminPage;
