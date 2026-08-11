import React from "react";
import { NavLink } from "react-router-dom";

function Navigation({ isAdmin }) {
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-primary-500 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="flex gap-2">
      {isAdmin && (
        <>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/" end className={linkClass}>
            Members
          </NavLink>
          <NavLink to="/contributions" className={linkClass}>
            All Transactions
          </NavLink>
          <NavLink to="/loans" className={linkClass}>
            Loans
          </NavLink>
          <NavLink to="/payments-ledger" className={linkClass}>
            Payments Ledger
          </NavLink>
          <NavLink to="/payment-entry" className={linkClass}>
            Record Payment
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>

          {/* Hamburger button — only visible on small screens */}
          <button
            className="sm:hidden p-2 text-gray-600"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? "✕" : "☰"}
          </button>

          {/* Desktop nav — inline row, hidden on mobile */}
          <nav className="hidden sm:flex gap-2">{links}</nav>

          {/* Mobile dropdown — only when open */}
          {open && (
            <nav className="sm:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg flex flex-col gap-1 p-4 z-20">
              {links}
            </nav>
          )}
        </>
      )}
      {!isAdmin && (
        <NavLink to="/my-profile" className={linkClass}>
          My Profile
        </NavLink>
      )}
    </nav>
  );
}

export default Navigation;
