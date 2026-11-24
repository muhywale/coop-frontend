import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Activity,
  Database,
  Building2,
  Megaphone,
  SlidersHorizontal,
  Coins,
  FileSpreadsheet,
  Landmark,
  History,
  ListOrdered,
  Gavel,
  FileText,
} from "lucide-react";
import { getResetRequestCount } from "../api/api";

const TINTS = {
  blue: "bg-blue-50 text-blue-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
};

const SECTIONS = [
  {
    title: "People and security",
    items: [
      {
        to: "/users",
        label: "Users",
        text: "Create logins, change roles, reset passwords",
        icon: Users,
        color: "blue",
        badge: true,
      },
      {
        to: "/activity-log",
        label: "Activity Log",
        text: "See who did what, and when",
        icon: Activity,
        color: "violet",
      },
      {
        to: "/backup",
        label: "Backup",
        text: "Download a copy of your data",
        icon: Database,
        color: "emerald",
      },
    ],
  },
  {
    title: "Your cooperative",
    items: [
      {
        to: "/settings",
        label: "Cooperative Settings",
        text: "Name, logo, contact details, repayment rounding",
        icon: Building2,
        color: "sky",
      },
      {
        to: "/notices",
        label: "Notices",
        text: "Post announcements for members",
        icon: Megaphone,
        color: "amber",
      },
      {
        to: "/request-rules",
        label: "Request Rules",
        text: "Withdrawals and borrowing guides",
        icon: SlidersHorizontal,
        color: "violet",
      },
      {
        to: "/member-dues",
        label: "Contribution Amounts",
        text: "Different monthly amounts for individual members",
        icon: Coins,
        color: "emerald",
      },
      {
        to: "/fine-rules",
        label: "Fine Rules",
        text: "Fines for late or short payments",
        icon: Gavel,
        color: "amber",
      },
      {
        to: "/loan-form-fees",
        label: "Loan Form Amounts",
        text: "The form amount charged for each loan type",
        icon: FileText,
        color: "sky",
      },
    ],
  },
  {
    title: "Data and setup",
    items: [
      {
        to: "/excel-import",
        label: "Excel Import",
        text: "Bring in members, payments and loans from Excel",
        icon: FileSpreadsheet,
        color: "emerald",
      },
      {
        to: "/bank-loan-import",
        label: "Bank Loan Import",
        text: "Import loans from the lists sent to the bank",
        icon: Landmark,
        color: "blue",
      },
      {
        to: "/carry-forward",
        label: "Carry Forward",
        text: "Balances brought forward from last year",
        icon: History,
        color: "amber",
      },
      {
        to: "/chart-of-accounts",
        label: "Chart of Accounts",
        text: "The list of ledger accounts",
        icon: ListOrdered,
        color: "violet",
      },
    ],
  },
];

function SettingsHubPage() {
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    getResetRequestCount()
      .then((res) => setResetCount(res.data.count))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {section.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-start gap-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition"
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${TINTS[item.color]}`}
                  >
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                      {item.label}
                      {item.badge && resetCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {resetCount}
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-gray-500 mt-0.5">
                      {item.text}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SettingsHubPage;
