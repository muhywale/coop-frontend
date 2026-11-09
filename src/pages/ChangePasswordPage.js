import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changeMyPassword } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

const rules = (password) => [
  { ok: password.length >= 8, text: "At least 8 characters" },
  {
    ok: /[A-Za-z]/.test(password) && /\d/.test(password),
    text: "Letters and numbers",
  },
];

function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const forced = !!user?.must_change_password;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const type = show ? "text" : "password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.next !== form.confirm) {
      setError("The new passwords don't match");
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword({
        current_password: form.current,
        new_password: form.next,
      });
      setDone(true);
      // The old session is no longer valid, so sign out and send them to log in again
      setTimeout(async () => {
        await logout();
        navigate("/welcome", { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || "Could not change the password");
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Card className="max-w-md">
        <p className="font-semibold text-green-700">Password changed.</p>
        <p className="text-sm text-gray-600 mt-1">
          Taking you to the login page. Sign in with your new password.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <h2 className="text-xl font-bold mb-1">Change password</h2>
      {forced && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          Your password was set by an admin. Choose your own before you
          continue.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-500">
            {forced ? "Temporary password you were given" : "Current password"}
          </label>
          <input
            type={type}
            value={form.current}
            onChange={set("current")}
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">New password</label>
          <input
            type={type}
            value={form.next}
            onChange={set("next")}
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <ul className="mt-1 text-xs space-y-0.5">
            {rules(form.next).map((r) => (
              <li
                key={r.text}
                className={r.ok ? "text-green-600" : "text-gray-400"}
              >
                {r.ok ? "✓" : "○"} {r.text}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="text-xs text-gray-500">Confirm new password</label>
          <input
            type={type}
            value={form.confirm}
            onChange={set("confirm")}
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          Show passwords
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </Button>
      </form>
    </Card>
  );
}

export default ChangePasswordPage;
