import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getMemberProfile, updateMemberProfile } from "../api/api";
import ProfileTabs from "../components/ProfileTabs";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm";

const FIELD_KEYS = [
  "full_name",
  "member_number",
  "phone",
  "email",
  "address",
  "next_of_kin_name",
  "next_of_kin_phone",
  "next_of_kin_relationship",
  "occupation",
  "department",
  "date_joined",
  "retirement_date",
  "bank_name",
  "bank_account_number",
];

const toForm = (member) => {
  const form = {};
  FIELD_KEYS.forEach((k) => {
    form[k] = member[k] ?? "";
  });
  return form;
};

// "Retires in 3 years 4 months", or how long ago
const retirementNote = (dateStr) => {
  if (!dateStr) return "";
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const past = target < now;
  const [from, to] = past ? [target, now] : [now, target];

  let months =
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (rest > 0) parts.push(`${rest} month${rest === 1 ? "" : "s"}`);
  const span = parts.join(" ") || "less than a month";

  return past ? `Retired ${span} ago` : `Retires in ${span}`;
};

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function MemberDetailsPage() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMember(null);
    setError("");
    getMemberProfile(id)
      .then((res) => {
        setMember(res.data);
        setForm(toForm(res.data));
      })
      .catch(() => setError("Couldn't load this member's details."));
  }, [id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const input = (key, props = {}) => (
    <input
      value={form[key]}
      onChange={set(key)}
      className={inputClass}
      {...props}
    />
  );

  const dirty =
    member && form
      ? FIELD_KEYS.some(
          (k) => String(form[k] ?? "").trim() !== String(member[k] ?? ""),
        )
      : false;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateMemberProfile(id, form);
      setMember(res.data.member);
      setForm(toForm(res.data.member));
      setMessage({ text: res.data.message, ok: true });
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Couldn't save the changes.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(toForm(member));
    setMessage(null);
  };

  return (
    <div>
      <ProfileTabs baseUrl={`/members/${id}`} />

      {error && <p className="text-red-600">{error}</p>}
      {!error && !form && <p className="text-gray-500">Loading...</p>}

      {form && (
        <form onSubmit={save} className="space-y-6 max-w-4xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {member.full_name}
            </h2>
            <p className="text-sm text-gray-500">
              Correct anything that was entered wrongly. Changes are saved
              straight away and recorded in the Activity Log.
            </p>
          </div>

          <Card>
            <h3 className="font-semibold mb-4">Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name">
                {input("full_name", { required: true, maxLength: 120 })}
              </Field>
              <Field label="Member number">
                {input("member_number", { maxLength: 30 })}
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                {input("phone", {
                  maxLength: 20,
                  placeholder: "0803 000 0000",
                })}
              </Field>
              <Field label="Email">
                {input("email", { type: "email", maxLength: 120 })}
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea
                  value={form.address}
                  onChange={set("address")}
                  maxLength={300}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Next of kin</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Name">
                {input("next_of_kin_name", { maxLength: 120 })}
              </Field>
              <Field label="Phone">
                {input("next_of_kin_phone", { maxLength: 20 })}
              </Field>
              <Field label="Relationship">
                {input("next_of_kin_relationship", {
                  maxLength: 50,
                  placeholder: "e.g. Spouse, Brother",
                })}
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Work and dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Occupation">
                {input("occupation", { maxLength: 100 })}
              </Field>
              <Field label="Department">
                {input("department", { maxLength: 100 })}
              </Field>
              <Field label="Date joined">
                {input("date_joined", { type: "date" })}
              </Field>
              <Field label="Retirement date">
                {input("retirement_date", { type: "date" })}
                {form.retirement_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {retirementNote(form.retirement_date)}
                  </p>
                )}
              </Field>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-1">Bank</h3>
            <p className="text-xs text-gray-500 mb-4">
              The account number is also used to match names on the lists you
              import from the bank, so change it only to correct a mistake.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank name">
                {input("bank_name", { maxLength: 80 })}
              </Field>
              <Field label="Account number">
                {input("bank_account_number", {
                  maxLength: 24,
                  inputMode: "numeric",
                })}
              </Field>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={reset}
              disabled={saving || !dirty}
            >
              Undo changes
            </Button>
            {message && (
              <p
                className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}
              >
                {message.text}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default MemberDetailsPage;
