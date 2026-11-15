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
    contact_phone: "",
    contact_whatsapp: "",
    payment_note: "",
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyCooperative().then((res) =>
      setForm({
        name: res.data.name || "",
        logo_url: res.data.logo_url || "",
        primary_color: res.data.primary_color || "#2f7ed8",
        contact_phone: res.data.contact_phone || "",
        contact_whatsapp: res.data.contact_whatsapp || "",
        payment_note: res.data.payment_note || "",
      }),
    );
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await updateMyCooperative(form);
      setMessage({ text: "Saved.", ok: true });
      // Refresh the in-session details so the sidebar and tab title update straight away
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
    } finally {
      setSaving(false);
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
            onChange={set("name")}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">
            Logo address (optional)
          </label>
          <input
            value={form.logo_url}
            onChange={set("logo_url")}
            className={inputClass}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Primary colour</label>
          <input
            type="color"
            value={form.primary_color}
            onChange={set("primary_color")}
            className="h-10 w-20 border border-gray-300 rounded-md"
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold mb-1">What members see</h3>
          <p className="text-xs text-gray-500 mb-3">
            Shown on each member's profile page.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">
                Admin phone number
              </label>
              <input
                value={form.contact_phone}
                onChange={set("contact_phone")}
                className={inputClass}
                placeholder="0803 000 0000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                WhatsApp number (can be the same)
              </label>
              <input
                value={form.contact_whatsapp}
                onChange={set("contact_whatsapp")}
                className={inputClass}
                placeholder="0803 000 0000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">
                Note on "What I owe" (optional)
              </label>
              <input
                value={form.payment_note}
                onChange={set("payment_note")}
                maxLength={200}
                className={inputClass}
                placeholder="Deductions run from the 23rd to the end of the month"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
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
