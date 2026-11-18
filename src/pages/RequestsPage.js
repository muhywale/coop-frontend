import React, { useState, useEffect } from "react";
import { getRequests, approveRequest, declineRequest } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const filterClass = "border border-gray-300 rounded-md px-3 py-2";

const STATUS = {
  pending: ["Waiting", "bg-amber-100 text-amber-700"],
  approved: ["Approved", "bg-blue-100 text-blue-700"],
  done: ["Done", "bg-green-100 text-green-700"],
  declined: ["Declined", "bg-red-100 text-red-700"],
  cancelled: ["Cancelled", "bg-gray-100 text-gray-600"],
};

function Row({ label, children }) {
  return (
    <p className="text-sm">
      <span className="text-gray-500">{label}: </span>
      <span className="font-medium">{children}</span>
    </p>
  );
}

function Details({ r }) {
  const d = r.details || {};
  if (r.type === "contact") {
    return (
      <>
        {d.phone && (
          <Row label="Phone">
            {r.current_phone || "none on file"} → {d.phone}
          </Row>
        )}
        {d.email && (
          <Row label="Email">
            {r.current_email || "none on file"} → {d.email}
          </Row>
        )}
      </>
    );
  }
  return null;
}

function RequestCard({ r, onResult }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [label, style] = STATUS[r.status] || [
    r.status,
    "bg-gray-100 text-gray-600",
  ];

  const run = async (action) => {
    setBusy(true);
    try {
      const res = await action();
      onResult({ text: res.data.message, ok: true });
    } catch (err) {
      onResult({
        text: err.response?.data?.error || "Something went wrong.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  };

  const approve = () => run(() => approveRequest(r.id, { admin_note: note }));
  const decline = () => {
    if (!note.trim()) {
      onResult({
        text: "Write a short reason for the member before declining.",
        ok: false,
      });
      return;
    }
    run(() => declineRequest(r.id, note));
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">
            {r.full_name}
            {r.member_number && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                No. {r.member_number}
              </span>
            )}
          </p>
          <p className="text-sm text-gray-600">{r.type_label}</p>
          <Details r={r} />
          {r.member_note && <Row label="Member's note">{r.member_note}</Row>}
          <p className="text-xs text-gray-400">
            Sent {new Date(r.created_at).toLocaleString()}
          </p>
          {r.admin_note && r.status !== "pending" && (
            <Row label="Your note">{r.admin_note}</Row>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${style}`}>
          {label}
        </span>
      </div>

      {r.status === "pending" && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Note to the member (required if declining)"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={approve} disabled={busy}>
              Approve
            </Button>
            <Button variant="danger" onClick={decline} disabled={busy}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function RequestsPage() {
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => {
    getRequests(status)
      .then((res) => setRequests(res.data))
      .catch(() => setMessage({ text: "Couldn't load requests.", ok: false }));
  };

  useEffect(() => {
    setRequests(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleResult = (result) => {
    setMessage(result);
    if (result.ok) load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Member Requests</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={filterClass}
        >
          <option value="pending">Waiting for you</option>
          <option value="all">Everything</option>
          <option value="done">Done</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}

      {!requests ? (
        <p className="text-gray-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} r={r} onResult={handleResult} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
