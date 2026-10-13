import React, { useState, useEffect, useRef } from "react";
import { getMembers } from "../api/api";

function MemberSearchSelect({
  value,
  onChange,
  required = false,
  members: membersProp,
  suggestedIds = [],
}) {
  const [fetched, setFetched] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const members = membersProp || fetched;

  useEffect(() => {
    if (membersProp) return;
    getMembers().then((res) => setFetched(res.data));
  }, [membersProp]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = (m) =>
    `${m.member_number ? m.member_number + " — " : ""}${m.full_name}`;
  const selected = members.find((m) => String(m.id) === String(value));
  const suggested = new Set(suggestedIds.map(String));

  const q = query.trim().toLowerCase();
  const matches = members
    .filter(
      (m) =>
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        (m.member_number || "").toLowerCase().includes(q),
    )
    .sort(
      (a, b) =>
        Number(suggested.has(String(b.id))) -
        Number(suggested.has(String(a.id))),
    );
  const filtered = matches.slice(0, 50);

  const select = (m) => {
    onChange(m.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        tabIndex={-1}
        required={required}
        value={value || ""}
        onChange={() => {}}
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
      <input
        type="text"
        value={open ? query : selected ? label(selected) : ""}
        placeholder="Search member by name or number..."
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[0]) select(filtered[0]);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      {selected && !open && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          aria-label="Clear selection"
        >
          ✕
        </button>
      )}
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              No matching member
            </li>
          ) : (
            filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(m);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 flex justify-between gap-2"
                >
                  <span>{label(m)}</span>
                  {!q && suggested.has(String(m.id)) && (
                    <span className="text-xs text-primary-600">suggested</span>
                  )}
                </button>
              </li>
            ))
          )}
          {matches.length > 50 && (
            <li className="px-3 py-2 text-xs text-gray-400">
              Showing first 50, keep typing to narrow down
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default MemberSearchSelect;
