import React from "react";

function Table({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">{children}</table>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <thead>
      <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
        {children}
      </tr>
    </thead>
  );
}

function TableRow({ children }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">{children}</tr>
  );
}

export { Table, TableHead, TableRow };
