import React, { useState, useEffect } from "react";
import {
  getMyRequests,
  sendRequest,
  cancelMyRequest,
  getRequestOptions,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
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
    : "";

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
  if (r.type === "withdrawal") {
    return `Withdraw ${money(d.amount)} from ${d.product_name}${
      d.paid_on
        ? ` · paid out ${new Date(`${d.paid_on}T00:00:00`).toLocaleDateString()}`
        : ""
    }`;
  }
  if (r.type === "contribution") {
    return `Pay ${money(d.amount)} ${per(d.frequency)} into ${d.product_name}${
      d.effective_from ? ` · starts ${monthName(d.effective_from)}` : ""
    }`;
  }
  if (r.type === "loan") {
    const asked = `${money(d.amount)} ${d.product_name}${d.duration_value ? ` over ${term(d.duration_value, d.duration_unit)}` : ""}`;
    if (r.status === "approved") {
      return `Approved for ${money(d.approved_amount)}${d.approved_duration_value ? ` over ${term(d.approved_duration_value, d.approved_duration_unit)}` : ""}. Your admin will issue the loan. (You asked for ${asked}.)`;
    }
    if (r.status === "done")
      return `Loan issued: ${money(d.approved_amount)} ${d.product_name}`;
    return `Asked for ${asked}`;
  }
  return r.type_label;
};

function FormShell({ intro, error, sending, onSubmit, onCancel, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {intro && <p className="text-sm text-gray-500">{intro}</p>}
      {children}
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

// Shared by every form: sends, then reports back
function useSender(type, onSent) {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (e, fields) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await sendRequest({ type, ...fields });
      onSent(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Couldn't send your request. Please try again.",
      );
      setSending(false);
    }
  };
  return { error, sending, send };
}

function ContactForm({ onSent, onCancel }) {
  const [form, setForm] = useState({ phone: "", email: "", note: "" });
  const { error, sending, send } = useSender("contact", onSent);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <FormShell
      intro="Fill in only what has changed."
      error={error}
      sending={sending}
      onSubmit={(e) => send(e, form)}
      onCancel={onCancel}
    >
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
    </FormShell>
  );
}

function WithdrawalForm({ accounts, onSent, onCancel }) {
  const [form, setForm] = useState({
    product_id: String(accounts[0].id),
    amount: "",
    note: "",
  });
  const { error, sending, send } = useSender("withdrawal", onSent);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const account =
    accounts.find((a) => String(a.id) === form.product_id) || accounts[0];

  return (
    <FormShell
      intro="Your admin will check and pay this out."
      error={error}
      sending={sending}
      onSubmit={(e) => send(e, form)}
      onCancel={onCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500">Withdraw from</label>
          <select
            value={form.product_id}
            onChange={set("product_id")}
            className={inputClass}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({money(a.balance)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">
            Amount (up to {money(account.balance)})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={account.balance}
            value={form.amount}
            onChange={set("amount")}
            required
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">Reason (optional)</label>
        <input
          value={form.note}
          onChange={set("note")}
          maxLength={500}
          className={inputClass}
        />
      </div>
    </FormShell>
  );
}

function ContributionForm({ products, onSent, onCancel }) {
  const [form, setForm] = useState({
    product_id: String(products[0].id),
    amount: "",
    note: "",
  });
  const { error, sending, send } = useSender("contribution", onSent);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const product =
    products.find((p) => String(p.id) === form.product_id) || products[0];

  return (
    <FormShell
      intro="If approved, the new amount starts from the month your admin chooses. Past months don't change."
      error={error}
      sending={sending}
      onSubmit={(e) => send(e, form)}
      onCancel={onCancel}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500">Account</label>
          <select
            value={form.product_id}
            onChange={set("product_id")}
            className={inputClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">
            New amount {per(product.frequency)} (now{" "}
            {money(product.current_amount)})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={set("amount")}
            required
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
    </FormShell>
  );
}
function GuideNote({ guide, amount }) {
  if (!guide) return null;
  const above = Number.isFinite(amount) && amount > guide.limit;
  return (
    <div className="text-sm bg-blue-50 border border-blue-100 rounded-md px-3 py-2 space-y-1">
      <p>
        As a guide, you can usually borrow up to{" "}
        <strong>{money(guide.limit)}</strong> on this loan type (
        {guide.multiple}× your {guide.savings_label} of{" "}
        {money(guide.qualifying_savings)}
        {guide.outstanding > 0
          ? `, less ${money(guide.outstanding)} you still owe`
          : ""}
        ). Your admin decides each loan, so you can still ask for more and
        explain why.
      </p>
      {above && (
        <p className="text-amber-700">
          This is above the usual guide. Please explain why in the box below.
        </p>
      )}
    </div>
  );
}

function LoanForm({ products, onSent, onCancel }) {
  const [form, setForm] = useState({
    product_id: String(products[0].id),
    amount: "",
    duration_value: "",
    duration_unit: "months",
    purpose: "",
    note: "",
  });
  const { error, sending, send } = useSender("loan", onSent);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const amount = parseFloat(form.amount);
  const guide = (
    products.find((p) => String(p.id) === form.product_id) || products[0]
  ).guide;

  return (
    <FormShell
      intro="Your admin reviews every application. Nothing is paid out until it is approved and issued."
      error={error}
      sending={sending}
      onSubmit={(e) => send(e, form)}
      onCancel={onCancel}
    >
      <GuideNote guide={guide} amount={amount} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500">Loan type</label>
          <select
            value={form.product_id}
            onChange={set("product_id")}
            className={inputClass}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.interest_label ? ` (${p.interest_label})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">
            Amount you want to borrow
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={set("amount")}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">
            How long to repay (optional)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={form.duration_value}
            onChange={set("duration_value")}
            className={inputClass}
            placeholder="e.g. 12"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Weeks or months</label>
          <select
            value={form.duration_unit}
            onChange={set("duration_unit")}
            className={inputClass}
          >
            <option value="months">Months</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">What the loan is for</label>
        <input
          value={form.purpose}
          onChange={set("purpose")}
          maxLength={300}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">
          Anything else your admin should know (optional)
        </label>
        <input
          value={form.note}
          onChange={set("note")}
          maxLength={500}
          className={inputClass}
        />
      </div>
    </FormShell>
  );
}

function MyRequestsPage() {
  const [requests, setRequests] = useState(null);
  const [options, setOptions] = useState({
    withdrawable: [],
    contribution_products: [],
    loan_products: [],
    guide: null,
  });
  const [formType, setFormType] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => {
    getMyRequests()
      .then((res) => setRequests(res.data))
      .catch(() =>
        setMessage({ text: "Couldn't load your requests.", ok: false }),
      );
    getRequestOptions()
      .then((res) => setOptions(res.data))
      .catch(() => {});
  };

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

  const types = [{ key: "contact", label: "Update my phone or email" }];
  if (options.withdrawable.length > 0)
    types.push({ key: "withdrawal", label: "Withdraw savings" });
  if (options.contribution_products.length > 0)
    types.push({
      key: "contribution",
      label: "Change my monthly contribution",
    });
  if (options.loan_products.length > 0)
    types.push({ key: "loan", label: "Apply for a loan" });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Requests</h2>

      <Card>
        <h3 className="font-semibold mb-1">Send a request to your admin</h3>
        <p className="text-sm text-gray-500 mb-3">
          Nothing changes until your admin approves it.
        </p>

        {formType === "contact" && (
          <ContactForm onSent={handleSent} onCancel={() => setFormType(null)} />
        )}
        {formType === "withdrawal" && (
          <WithdrawalForm
            accounts={options.withdrawable}
            onSent={handleSent}
            onCancel={() => setFormType(null)}
          />
        )}
        {formType === "contribution" && (
          <ContributionForm
            products={options.contribution_products}
            onSent={handleSent}
            onCancel={() => setFormType(null)}
          />
        )}
        {formType === "loan" && (
          <LoanForm
            products={options.loan_products}
            onSent={handleSent}
            onCancel={() => setFormType(null)}
          />
        )}
        {!formType && (
          <div className="flex flex-wrap gap-3">
            {types.map((t) => (
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
