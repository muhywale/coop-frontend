import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500";

function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await changePassword({ new_password: newPassword });
      // update local user state so must_change_password no longer blocks navigation
      login({ ...user, must_change_password: false }, token);
      navigate(user.role === "admin" ? "/" : "/my-profile");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <Card>
        <h2 className="text-xl font-bold mb-2">Set Your Password</h2>
        <p className="text-sm text-gray-500 mb-6">
          You're using a temporary password. Please set a new one to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <Button type="submit" className="w-full">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default ChangePasswordPage;
