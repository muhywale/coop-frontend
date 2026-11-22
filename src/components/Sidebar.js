import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Inbox,
  Wallet,
  BookOpen,
  ArrowLeftRight,
  CalendarClock,
  HandCoins,
  Banknote,
  Package,
  Calculator,
  BookText,
  Scale,
  Coins,
  Landmark,
  ClipboardList,
  TrendingUp,
  FileText,
  Settings,
  ShieldCheck,
  User,
  Receipt,
  KeyRound,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import Logo from "./ui/Logo";
import {
  getResetRequestCount,
  getPlatformResetCount,
  getRequestCount,
} from "../api/api";

// Each colour is written out in full so Tailwind includes the classes
const COLORS = {
  sky: {
    icon: "text-sky-500",
    on: "bg-sky-50 text-sky-700",
    bar: "border-sky-500",
    head: "text-sky-600",
  },
  blue: {
    icon: "text-blue-500",
    on: "bg-blue-50 text-blue-700",
    bar: "border-blue-500",
    head: "text-blue-600",
  },
  emerald: {
    icon: "text-emerald-500",
    on: "bg-emerald-50 text-emerald-700",
    bar: "border-emerald-500",
    head: "text-emerald-600",
  },
  violet: {
    icon: "text-violet-500",
    on: "bg-violet-50 text-violet-700",
    bar: "border-violet-500",
    head: "text-violet-600",
  },
  amber: {
    icon: "text-amber-500",
    on: "bg-amber-50 text-amber-700",
    bar: "border-amber-500",
    head: "text-amber-600",
  },
  slate: {
    icon: "text-slate-500",
    on: "bg-slate-100 text-slate-700",
    bar: "border-slate-500",
    head: "text-slate-600",
  },
};

// Pages that now live behind the Settings page. The Settings link stays lit while you're on any of them.
const SETUP_PATHS = [
  "/users",
  "/backup",
  "/notices",
  "/settings",
  "/request-rules",
  "/member-dues",
  "/activity-log",
  "/excel-import",
  "/bank-loan-import",
  "/carry-forward",
  "/chart-of-accounts",
];

// A group with no label is shown as a single top-level link
const NAV = [
  {
    key: "dashboard",
    color: "sky",
    links: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    key: "members",
    label: "Members",
    color: "blue",
    icon: Users,
    links: [
      { to: "/", also: ["/members"], label: "Members", icon: Users },
      { to: "/requests", label: "Requests", icon: Inbox, badge: "requests" },
    ],
  },
  {
    key: "money",
    label: "Money",
    color: "emerald",
    icon: Wallet,
    links: [
      { to: "/payment-entry", label: "Record Payment", icon: Wallet },
      { to: "/payments-ledger", label: "Payments Ledger", icon: BookOpen },
      {
        to: "/all-transactions",
        label: "All Transactions",
        icon: ArrowLeftRight,
      },
      { to: "/schedule", label: "Payment Schedule", icon: CalendarClock },
      { to: "/loans", label: "Loans", icon: HandCoins },
      { to: "/withdrawal", label: "Withdrawal", icon: Banknote },
      { to: "/products", label: "Products", icon: Package },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    color: "violet",
    icon: Calculator,
    links: [
      { to: "/journal-entry", label: "Journal Entry", icon: Calculator },
      { to: "/account-ledger", label: "Account Ledger", icon: BookText },
      { to: "/trial-balance", label: "Trial Balance", icon: Scale },
      { to: "/income-expenditure", label: "Income & Expenditure", icon: Coins },
      { to: "/balance-sheet", label: "Balance Sheet", icon: Landmark },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    color: "amber",
    icon: FileText,
    links: [
      {
        to: "/member-balances",
        label: "Individual Balances",
        icon: ClipboardList,
      },
      { to: "/loan-performance", label: "Loan Performance", icon: TrendingUp },
      { to: "/year-end", label: "Year-End Report", icon: FileText },
    ],
  },
  {
    key: "settings",
    color: "slate",
    links: [
      {
        to: "/setup",
        also: SETUP_PATHS,
        label: "Settings",
        icon: Settings,
        badge: "reset",
      },
    ],
  },
];

const MEMBER_LINKS = [
  { to: "/my-profile", label: "My Profile", icon: User },
  { to: "/my-loans", label: "My Loans", icon: HandCoins },
  { to: "/my-receipts", label: "Receipts", icon: Receipt },
  { to: "/my-requests", label: "Requests", icon: Inbox },
];

const isOn = (link, path) =>
  [link.to, ...(link.also || [])].some((target) =>
    target === "/"
      ? path === "/"
      : path === target || path.startsWith(`${target}/`),
  );

// Refreshes a count (red badge) once a minute
function usePolledCount(enabled, fetcher) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const load = () =>
      fetcher()
        .then((res) => setCount(res.data.count))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [enabled, fetcher]);
  return count;
}

function Sidebar({ isAdmin, onLogout, userLabel, user }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({
    members: true,
    money: true,
    accounting: false,
    reports: false,
  });

  const resetCount = usePolledCount(isAdmin, getResetRequestCount);
  const requestCount = usePolledCount(isAdmin, getRequestCount);
  const platformCount = usePolledCount(
    user?.role === "super_admin",
    getPlatformResetCount,
  );
  const counts = {
    reset: resetCount,
    requests: requestCount,
    platform: platformCount,
  };
  const alerts = resetCount + requestCount + platformCount;

  // Open the group that holds the page you're on
  useEffect(() => {
    const group = NAV.find(
      (g) => g.label && g.links.some((l) => isOn(l, pathname)),
    );
    if (group)
      setExpanded((prev) =>
        prev[group.key] ? prev : { ...prev, [group.key]: true },
      );
  }, [pathname]);

  const toggle = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderLink = (l, color, closeOnClick) => {
    const c = COLORS[color];
    const active = isOn(l, pathname);
    const count = l.badge ? counts[l.badge] : 0;
    const Icon = l.icon;
    return (
      <Link
        key={l.to}
        to={l.to}
        onClick={closeOnClick}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium border-l-4 transition ${
          active
            ? `${c.on} ${c.bar}`
            : "text-gray-600 border-transparent hover:bg-gray-100"
        }`}
      >
        <Icon size={18} className={active ? "" : c.icon} />
        <span className="truncate">{l.label}</span>
        {count > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {count}
          </span>
        )}
      </Link>
    );
  };

  const renderGroup = (group, closeOnClick) => {
    if (!group.label)
      return renderLink(group.links[0], group.color, closeOnClick);

    const c = COLORS[group.color];
    const GroupIcon = group.icon;
    const isOpen = !!expanded[group.key];
    const waiting = group.links.reduce(
      (n, l) => n + (l.badge ? counts[l.badge] : 0),
      0,
    );

    return (
      <div key={group.key}>
        <button
          type="button"
          onClick={() => toggle(group.key)}
          aria-expanded={isOpen}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50"
        >
          <GroupIcon size={18} className={c.icon} />
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${c.head}`}
          >
            {group.label}
          </span>
          {!isOpen && waiting > 0 && (
            <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
              {waiting}
            </span>
          )}
          <ChevronRight
            size={14}
            className={`ml-auto text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="mt-1 ml-3 space-y-0.5">
            {group.links.map((l) => renderLink(l, group.color, closeOnClick))}
          </div>
        )}
      </div>
    );
  };

  const renderBody = (closeOnClick) => (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        {user?.logo_url ? (
          <img
            src={user.logo_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <Logo className="w-9 h-9" />
        )}
        <span className="font-bold text-primary-700 text-sm truncate">
          {user?.cooperative_name || "Cooperative"}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {isAdmin ? (
          <>
            {NAV.map((group) => renderGroup(group, closeOnClick))}
            {user?.role === "super_admin" && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <p className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Platform
                </p>
                {renderLink(
                  {
                    to: "/super-admin",
                    label: "Super Admin",
                    icon: ShieldCheck,
                    badge: "platform",
                  },
                  "slate",
                  closeOnClick,
                )}
              </div>
            )}
          </>
        ) : (
          MEMBER_LINKS.map((l) => renderLink(l, "blue", closeOnClick))
        )}
      </nav>

      <div className="border-t border-gray-100 p-4 space-y-1">
        <p className="text-xs text-gray-500 truncate mb-2">{userLabel}</p>
        <Link
          to="/change-password"
          onClick={closeOnClick}
          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary-600 py-1"
        >
          <KeyRound size={15} /> Change password
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-md px-3 py-1.5 transition"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden flex items-center justify-between gap-3 bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          {user?.logo_url ? (
            <img
              src={user.logo_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Logo className="w-8 h-8" />
          )}
          <span className="font-bold text-primary-700 text-sm truncate">
            {user?.cooperative_name || ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative p-2 text-gray-600"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          {!open && alerts > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
            {renderBody(() => setOpen(false))}
          </aside>
        </>
      )}

      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-gray-200 flex-shrink-0">
        {renderBody(undefined)}
      </aside>
    </>
  );
}

export default Sidebar;
