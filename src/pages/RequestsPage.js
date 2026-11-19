import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getRequests,
  approveRequest,
  declineRequest,
  completeRequest,
} from "../api/api";
import { toLocalDateString } from "../utils/dateHelper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const filterClass = "border border-gray-300 rounded-md px-3 py-2";
const money = (n) =>
  `₦${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const monthName = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
const per = (frequency) => (frequency === "weekly" ? "a week" : "a month");
const term = (value, unit) =>
  value
    ? `${value} ${unit === "weeks" ? "week" : "month"}${value === 1 ? "" : "s"}`
    : "not stated";
const nextMonthValue = () => {
  const d = new Date();
  return toLocalDateString(
    new Date(d.getFullYear(), d.getMonth() + 1, 1),
  ).slice(0, 7);
};

const STATUS = {
  pending: ["Waiting", "bg-amber-100 text-amber-700"],
  approved: ["Approved, to be issued", "bg-blue-100 text-blue-700"],
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
  const c = r.context;

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
  if (r.type === "withdrawal") {
    const short = c && d.amount > c.balance + 0.005;
    return (
      <>
        <Row label="Account">{d.product_name}</Row>
        <Row label="Amount asked for">{money(d.amount)}</Row>
        {c && (
          <Row label="Balance now">
            <span className={short ? "text-red-600" : ""}>
              {money(c.balance)}
            </span>
          </Row>
        )}
        {d.paid_on && (
          <Row label="Paid out on">
            {new Date(`${d.paid_on}T00:00:00`).toLocaleDateString()}
          </Row>
        )}
      </>
    );
  }
  if (r.type === "contribution") {
    return (
      <>
        <Row label="Account">{d.product_name}</Row>
        {c && (
          <Row label="Pays now">
            {money(c.current_amount)} {per(d.frequency)}
          </Row>
        )}
        <Row label="Asks to pay">
          {money(d.amount)} {per(d.frequency)}
        </Row>
        {d.effective_from && (
          <Row label="Starts">{monthName(d.effective_from)}</Row>
        )}
      </>
    );
  }
  if (r.type === "loan") {
    const guide = c?.guide;
    const over = guide && d.amount > guide.limit + 0.005;
    return (
      <>
        <Row label="Loan type">{d.product_name}</Row>
        <Row label="Asked for">
          {money(d.amount)} over {term(d.duration_value, d.duration_unit)}
        </Row>
        {d.purpose && <Row label="Purpose">{d.purpose}</Row>}
        {c && (
          <div className="mt-2 text-sm bg-gray-50 border border-gray-100 rounded-md px-3 py-2 space-y-0.5">
            <Row label="Savings">{money(c.savings_total)}</Row>
            <Row label="Still owes on loans">
              {money(c.outstanding)}
              {c.active_loans > 0 ? ` (${c.active_loans} active)` : ""}
            </Row>
            {guide ? (
              <Row label={`Guide (${guide.multiple}× savings)`}>
                {money(guide.limit)}
                {over && (
                  <span className="ml-2 text-amber-700">
                    Asked for {money(d.amount - guide.limit)} more than the
                    guide
                  </span>
                )}
              </Row>
            ) : (
              <p className="text-xs text-gray-400">
                No borrowing guide set. You can add one under Request Rules.
              </p>
            )}
          </div>
        )}
        {d.approved_amount && (
          <Row label="Approved">
            {money(d.approved_amount)} over{" "}
            {term(d.approved_duration_value, d.approved_duration_unit)}
          </Row>
        )}
        {d.issued_on && (
          <Row label="Issued">
            {new Date(`${d.issued_on}T00:00:00`).toLocaleDateString()}
          </Row>
        )}
      </>
    );
  }
  return null;
}

function RequestCard({ r, onResult }) {
  const d = r.details || {};
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [startMonth, setStartMonth] = useState(nextMonthValue());
  const [approvedAmount, setApprovedAmount] = useState(d.amount ?? "");
  const [duration, setDuration] = useState(d.duration_value ?? "");
  const [unit, setUnit] = useState(d.duration_unit || "months");
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

  const approve = () => {
    const payload = { admin_note: note };
    if (r.type === "withdrawal") {
      const ok = window.confirm(
        `Record a withdrawal of ${money(d.amount)} from ${d.product_name} for ${r.full_name}, dated ${new Date(`${date}T00:00:00`).toLocaleDateString()}?\n\nThis posts to the ledger as cash paid out. Only continue once the money has been paid.`,
      );
      if (!ok) return;
      payload.date = date;
    }
    if (r.type === "contribution") payload.effective_from = `${startMonth}-01`;
    if (r.type === "loan") {
      payload.approved_amount = approvedAmount;
      payload.approved_duration_value = duration;
      payload.approved_duration_unit = unit;
    }
    run(() => approveRequest(r.id, payload));
  };

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

  const inputSmall = "border border-gray-300 rounded-md px-3 py-2 text-sm";

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
          {r.type === "withdrawal" && (
            <div>
              <label className="text-xs text-gray-500 block">
                Date the money is paid out
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputSmall}
              />
            </div>
          )}
          {r.type === "contribution" && (
            <div>
              <label className="text-xs text-gray-500 block">
                New amount starts from
              </label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className={inputSmall}
              />
            </div>
          )}
          {r.type === "loan" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-gray-500 block">
                  Approve amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className={`${inputSmall} w-40`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block">
                  Repay over
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`${inputSmall} w-24`}
                />
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={inputSmall}
              >
                <option value="months">Months</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Note to the member (required if declining)"
            className={`w-full ${inputSmall}`}
          />
          <div className="flex gap-2">
            <Button onClick={approve} disabled={busy}>
              {r.type === "withdrawal" ? "Approve & record" : "Approve"}
            </Button>
            <Button variant="danger" onClick={decline} disabled={busy}>
              Decline
            </Button>
          </div>
        </div>
      )}

      {r.status === "approved" && r.type === "loan" && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
          <p className="text-sm text-gray-600">
            Issue this loan on the{" "}
            <Link to="/loans" className="text-primary-600 hover:underline">
              Loans page
            </Link>
            , then mark it here so the member sees it's done.
          </p>
          <Button
            onClick={() => run(() => completeRequest(r.id))}
            disabled={busy}
          >
            Mark as issued
          </Button>
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
          <option value="approved">Approved loans, to be issued</option>
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
