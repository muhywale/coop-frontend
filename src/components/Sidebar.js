import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Logo from "./ui/Logo";

function Sidebar({ isAdmin, onLogout, userLabel, user }) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    core: true,
    members: true,
    accounting: false,
    reports: false,
  });

  const toggleGroup = (key) =>
    setExpandedGroups({ ...expandedGroups, [key]: !expandedGroups[key] });

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition ${
      isActive ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  const groups = [
    {
      key: "core",
      label: "Overview",
      links: [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/member-balances", label: "Individual Balances" },
      ],
    },
    {
      key: "members",
      label: "Members & Loans",
      links: [
        { to: "/", label: "Members", end: true },
        { to: "/loans", label: "Loans" },
        { to: "/loan-performance", label: "Loan Performance" },
        { to: "/products", label: "Products" },
        { to: "/withdrawal", label: "Withdrawal" },
      ],
    },
    {
      key: "payments",
      label: "Payments",
      links: [
        { to: "/payments-ledger", label: "Payments Ledger" },
        { to: "/payment-entry", label: "Record Payment" },
        { to: "/all-transactions", label: "All Transactions" },
        { to: "/excel-import", label: "Excel Import" },
      ],
    },
    {
      key: "accounting",
      label: "Accounting",
      links: [
        { to: "/journal-entry", label: "Journal Entry" },
        { to: "/trial-balance", label: "Trial Balance" },
        { to: "/income-expenditure", label: "Income & Expenditure" },
        { to: "/balance-sheet", label: "Balance Sheet" },
        { to: "/account-ledger", label: "Account Ledger" },
        { to: "/chart-of-accounts", label: "Chart of Accounts" },
      ],
    },
  ];

  const memberLinks = [{ to: "/my-profile", label: "My Profile" }];

  const renderLinks = (links, closeOnClick) =>
    links.map((l) => (
      <NavLink
        key={l.to}
        to={l.to}
        end={l.end}
        className={linkClass}
        onClick={closeOnClick}
      >
        {l.label}
      </NavLink>
    ));

  const SidebarBody = ({ closeOnClick }) => (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <Logo className="w-9 h-9" />
        <span className="font-bold text-primary-700 text-sm">Cooperative</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {isAdmin ? (
          <>
            {groups.map((group) => (
              <div key={group.key} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase hover:text-gray-600"
                >
                  {group.label}
                  <span
                    className={`transform transition-transform ${expandedGroups[group.key] ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                </button>
                {expandedGroups[group.key] && (
                  <div className="space-y-1">
                    {renderLinks(group.links, closeOnClick)}
                  </div>
                )}
              </div>
            ))}

            {user?.role === "super_admin" && (
              <div className="mb-1">
                <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Platform
                </p>
                <NavLink
                  to="/super-admin"
                  className={linkClass}
                  onClick={closeOnClick}
                >
                  Super Admin
                </NavLink>
              </div>
            )}
          </>
        ) : (
          renderLinks(memberLinks, closeOnClick)
        )}
      </nav>
      <div className="border-t border-gray-100 p-4">
        <p className="text-xs text-gray-500 truncate mb-2">{userLabel}</p>
        <button
          onClick={onLogout}
          className="w-full text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-md px-3 py-1.5 transition"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <Logo className="w-8 h-8" />
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-gray-600"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
            <SidebarBody closeOnClick={() => setOpen(false)} />
          </aside>
        </>
      )}

      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarBody closeOnClick={undefined} />
      </aside>
    </>
  );
}

export default Sidebar;
