import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await requestPasswordReset({ username, note });
      setMessage(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-1">Forgot your password?</h2>

        {message ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              {message}
            </p>
            <p className="text-sm text-gray-600">
              Your admin will give you a temporary password. You'll be asked to
              choose your own when you sign in.
            </p>
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Enter your username and your admin will be notified to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Phone number or note (optional, helps your admin confirm it's
                  you)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Notify my admin"}
                </Button>
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
