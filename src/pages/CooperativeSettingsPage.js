import React, { useState, useEffect } from "react";
import { getMyCooperative, updateMyCooperative } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function CooperativeSettingsPage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    primary_color: "#2f7ed8",
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getMyCooperative().then((res) => setForm(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateMyCooperative(form);
      setMessage({ text: "Saved.", ok: true });
      // Refresh the in-session user object so the sidebar/title update immediately
      login({
        ...user,
        cooperative_name: res.data.name,
        logo_url: res.data.logo_url,
        primary_color: res.data.primary_color,
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to save",
        ok: false,
      });
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Cooperative Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="text-xs text-gray-500">Cooperative name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Logo URL (optional)</label>
          <input
            value={form.logo_url || ""}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            className={inputClass}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Primary color</label>
          <input
            type="color"
            value={form.primary_color || "#2f7ed8"}
            onChange={(e) =>
              setForm({ ...form, primary_color: e.target.value })
            }
            className="h-10 w-20 border border-gray-300 rounded-md"
          />
        </div>
        <Button type="submit">Save</Button>
      </form>
      {message && (
        <p
          className={`text-sm mt-3 ${message.ok ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </Card>
  );
}

export default CooperativeSettingsPage;
