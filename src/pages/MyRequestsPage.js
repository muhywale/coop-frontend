import React, { useState, useEffect } from "react";
import { getMyRequests, sendRequest, cancelMyRequest } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";

// Request types members can send. More are added in later pieces.
const REQUEST_TYPES = [{ key: "contact", label: "Update my phone or email" }];

const STATUS = {
  pending: ["Waiting", "bg-amber-100 text-amber-700"],
  approved: ["Approved", "bg-blue-100 text-blue-700"],
  done: ["Done", "bg-green-100 text-green-700"],
  declined: ["Declined", "bg-red-100 text-red-700"],
  cancelled: ["Cancelled", "bg-gray-100 text-gray-600"],
};

const summary = (r) => {
  const d = r.details || {};
  if (r.type === "contact") {
    return [
      d.phone && `New phone: ${d.phone}`,
      d.email && `New email: ${d.email}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return r.type_label;
};

function ContactForm({ onSent, onCancel }) {
  const [form, setForm] = useState({ phone: "", email: "", note: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await sendRequest({ type: "contact", ...form });
      onSent(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Couldn't send your request. Please try again.",
      );
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-500">Fill in only what has changed.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500">New phone number</label>
          <input
            value={form.phone}
            onChange={set("phone")}
            className={inputClass}
            placeholder="0803 000 0000"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">New email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">
          Note to your admin (optional)
        </label>
        <input
          value={form.note}
          onChange={set("note")}
          maxLength={500}
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send request"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MyRequestsPage() {
  const [requests, setRequests] = useState(null);
  const [formType, setFormType] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () =>
    getMyRequests()
      .then((res) => setRequests(res.data))
      .catch(() =>
        setMessage({ text: "Couldn't load your requests.", ok: false }),
      );

  useEffect(() => {
    load();
  }, []);

  const handleSent = (text) => {
    setFormType(null);
    setMessage({ text, ok: true });
    load();
  };

  const handleCancel = async (r) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await cancelMyRequest(r.id);
      load();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Couldn't cancel that request.",
        ok: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Requests</h2>

      <Card>
        <h3 className="font-semibold mb-1">Send a request to your admin</h3>
        <p className="text-sm text-gray-500 mb-3">
          Nothing changes until your admin approves it.
        </p>

        {formType === "contact" ? (
          <ContactForm onSent={handleSent} onCancel={() => setFormType(null)} />
        ) : (
          <div className="flex flex-wrap gap-3">
            {REQUEST_TYPES.map((t) => (
              <Button
                key={t.key}
                variant="secondary"
                onClick={() => {
                  setMessage(null);
                  setFormType(t.key);
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-3">My requests</h3>
        {!requests ? (
          <p className="text-gray-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500">You haven't sent any requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const [label, style] = STATUS[r.status] || [
                r.status,
                "bg-gray-100 text-gray-600",
              ];
              return (
                <Card key={r.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{r.type_label}</p>
                      <p className="text-sm text-gray-600">{summary(r)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Sent {new Date(r.created_at).toLocaleDateString()}
                      </p>
                      {r.admin_note && (
                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-md px-3 py-2 mt-2">
                          Your admin says: {r.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${style}`}
                      >
                        {label}
                      </span>
                      {r.status === "pending" && (
                        <Button
                          variant="secondary"
                          onClick={() => handleCancel(r)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRequestsPage;
