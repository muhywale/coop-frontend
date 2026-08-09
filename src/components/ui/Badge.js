import React from "react";

function Badge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    paid: "bg-blue-100 text-blue-700",
    inactive: "bg-gray-100 text-gray-600",
    defaulted: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default Badge;
