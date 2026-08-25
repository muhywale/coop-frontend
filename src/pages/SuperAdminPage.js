import React, { useState, useEffect } from "react";
import { getCooperatives, createCooperative } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Table, TableHead, TableRow } from "../components/ui/Table";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function SuperAdminPage() {
  const [cooperatives, setCooperatives] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    admin_full_name: "",
    admin_username: "",
    admin_password: "",
  });
  const [message, setMessage] = useState("");

  const fetchCooperatives = () =>
    getCooperatives().then((res) => setCooperatives(res.data));
  useEffect(() => {
    fetchCooperatives();
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
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create cooperative");
    }
  };

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
    </div>
  );
}

export default SuperAdminPage;
