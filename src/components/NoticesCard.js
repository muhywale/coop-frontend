import React, { useState, useEffect } from "react";
import { getPortalNotices } from "../api/api";
import Card from "./ui/Card";

function NoticesCard() {
  const [notices, setNotices] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getPortalNotices()
      .then((res) => setNotices(res.data))
      .catch(() => setNotices([]));
  }, []);

  if (!notices || notices.length === 0) return null;
  const visible = showAll ? notices : notices.slice(0, 3);

  return (
    <Card>
      <h3 className="font-semibold mb-3">Notices</h3>
      <ul className="divide-y divide-gray-100">
        {visible.map((n) => (
          <li key={n.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm">{n.title}</p>
              {n.pinned && (
                <span className="text-[10px] uppercase bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                  Pinned
                </span>
              )}
              {n.is_new && (
                <span className="text-[10px] uppercase bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                  New
                </span>
              )}
              <span className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
              {n.body}
            </p>
          </li>
        ))}
      </ul>
      {notices.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-primary-600 hover:underline mt-3"
        >
          {showAll ? "Show fewer" : `Show all ${notices.length}`}
        </button>
      )}
    </Card>
  );
}

export default NoticesCard;
