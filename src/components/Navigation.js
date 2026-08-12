import React, { useState } from "react";
import { NavLink } from "react-router-dom";

function Navigation({ isAdmin }) {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `block sm:inline-block px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  const links = isAdmin ? (
    <>
      <NavLink
        to="/dashboard"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Dashboard
      </NavLink>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Members
      </NavLink>
      <NavLink
        to="/contributions"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        All Transactions
      </NavLink>
      <NavLink to="/loans" className={linkClass} onClick={() => setOpen(false)}>
        Loans
      </NavLink>
      <NavLink
        to="/products"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Products
      </NavLink>
      <NavLink
        to="/trial-Balance"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Trial Balance
      </NavLink>
      <NavLink
        to="/journal-entry"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Journal Entry
      </NavLink>
      <NavLink
        to="/payments-ledger"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Payments Ledger
      </NavLink>
      <NavLink
        to="/payment-entry"
        className={linkClass}
        onClick={() => setOpen(false)}
      >
        Record Payment
      </NavLink>
    </>
  ) : (
    <NavLink
      to="/my-profile"
      className={linkClass}
      onClick={() => setOpen(false)}
    >
      My Profile
    </NavLink>
  );

  return (
    <>
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
  );
}

export default Navigation;
