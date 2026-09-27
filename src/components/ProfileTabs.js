import React from "react";
import { NavLink } from "react-router-dom";

function ProfileTabs({ baseUrl }) {
  const tabClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition ${
      isActive
        ? "border-primary-500 text-primary-700"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      <NavLink to={baseUrl} end className={tabClass}>
        Profile
      </NavLink>
      <NavLink to={`${baseUrl}/ledger`} className={tabClass}>
        Ledger
      </NavLink>
    </div>
  );
}

export default ProfileTabs;
