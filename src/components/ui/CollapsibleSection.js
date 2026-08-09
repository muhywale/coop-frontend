import React, { useState } from "react";

function CollapsibleSection({
  title,
  balance,
  balanceColor = "text-green-600",
  children,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span
            className={`transform transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          <h4 className="font-semibold">{title}</h4>
        </div>
        {balance !== undefined && (
          <span className={`font-bold ${balanceColor}`}>
            ₦{balance.toLocaleString()}
          </span>
        )}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default CollapsibleSection;
