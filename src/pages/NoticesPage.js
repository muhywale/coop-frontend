import React, { useState, useEffect } from "react";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
const emptyForm = () => ({
  title: "",
  body: "",
  pinned: false,
  expires_on: "",
});

function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchNotices = () => getNotices().then((res) => setNotices(res.data));
  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      if (editingId) await updateNotice(editingId, form);
      else await createNotice(form);
      setMessage({
        text: editingId
          ? "Notice updated."
          : "Notice posted. Members can see it now.",
        ok: true,
      });
      setForm(emptyForm());
      setEditingId(null);
      fetchNotices();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Couldn't save the notice",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body,
      pinned: n.pinned,
      expires_on: n.expires_on || "",
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (n) => {
    if (
      !window.confirm(
        `Delete the notice "${n.title}"? Members will no longer see it.`,
      )
    )
      return;
    try {
      await deleteNotice(n.id);
      if (editingId === n.id) {
        setEditingId(null);
        setForm(emptyForm());
      }
      fetchNotices();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Couldn't delete the notice",
        ok: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notices</h2>

      <Card>
        <h3 className="font-semibold mb-1">
          {editingId ? "Edit notice" : "Post a notice"}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Members see this on their profile page. Plain text only. Line breaks
          are kept.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={120}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
              maxLength={2000}
              rows={5}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin to the top
            </label>
            <div>
              <label className="text-xs text-gray-500 block">
                Hide after (optional)
              </label>
              <input
                type="date"
                value={form.expires_on}
                onChange={(e) =>
                  setForm({ ...form, expires_on: e.target.value })
                }
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Post notice"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
        {message && (
          <p
            className={`text-sm mt-3 ${message.ok ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </Card>

      {notices.length === 0 ? (
        <p className="text-gray-500">No notices yet.</p>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className={n.expired ? "opacity-60" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{n.title}</p>
                    {n.pinned && (
                      <span className="text-[10px] uppercase bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        Pinned
                      </span>
                    )}
                    {n.expired && (
                      <span className="text-[10px] uppercase bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Posted {new Date(n.created_at).toLocaleDateString()}
                    {n.expires_on
                      ? ` · hides after ${new Date(`${n.expires_on}T00:00:00`).toLocaleDateString()}`
                      : ""}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                    {n.body}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEdit(n)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(n)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default NoticesPage;
