import React, { useState, useEffect, useRef } from "react";
import { getMembers } from "../api/api";

function MemberSearchSelect({ value, onChange, required = false }) {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    getMembers().then((res) => setMembers(res.data));
  }, []);

  // Close the dropdown when clicking outside
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

  const q = query.trim().toLowerCase();
  const matches = members.filter(
    (m) =>
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      (m.member_number || "").toLowerCase().includes(q),
  );
  const filtered = matches.slice(0, 50);

  const select = (m) => {
    onChange(m.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Invisible input so the browser's native "required" check still works */}
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
                  className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50"
                >
                  {label(m)}
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
