import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const num = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const blank = (n) => (n ? num(n) : "");
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString();

export function downloadStatementPDF(data) {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const member = data.member;

  doc.setFontSize(16);
  doc.text(data.cooperative.name || "Cooperative", width / 2, 16, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.text(`Statement of Account — ${data.year}`, width / 2, 24, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.text(
    `Member: ${member.full_name}${member.member_number ? `    Member No: ${member.member_number}` : ""}`,
    14,
    34,
  );
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

  let y = 48;
  const headStyles = { fillColor: [47, 126, 216] };

  if (data.savings.length > 0) {
    doc.setFontSize(11);
    doc.text("Savings (NGN)", 14, y);
    autoTable(doc, {
      startY: y + 2,
      head: [["Product", "Opening", "Paid in", "Withdrawn", "Closing"]],
      body: data.savings.map((s) => [
        s.product,
        num(s.opening),
        num(s.paid_in),
        num(s.withdrawn),
        num(s.closing),
      ]),
      foot: [
        [
          "Total",
          num(data.savings.reduce((t, s) => t + s.opening, 0)),
          num(data.savings.reduce((t, s) => t + s.paid_in, 0)),
          num(data.savings.reduce((t, s) => t + s.withdrawn, 0)),
          num(data.savings.reduce((t, s) => t + s.closing, 0)),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles,
      footStyles: { fillColor: [235, 235, 235], textColor: 20 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (data.loans.length > 0) {
    doc.setFontSize(11);
    doc.text("Loans (NGN)", 14, y);
    autoTable(doc, {
      startY: y + 2,
      head: [
        ["Product", "Opening", "Issued", "Interest added", "Repaid", "Balance"],
      ],
      body: data.loans.map((l) => [
        l.product,
        num(l.opening),
        num(l.issued),
        num(l.interest),
        num(l.repaid),
        num(l.closing),
      ]),
      foot: [
        [
          "Total",
          num(data.loans.reduce((t, l) => t + l.opening, 0)),
          num(data.loans.reduce((t, l) => t + l.issued, 0)),
          num(data.loans.reduce((t, l) => t + l.interest, 0)),
          num(data.loans.reduce((t, l) => t + l.repaid, 0)),
          num(data.loans.reduce((t, l) => t + l.closing, 0)),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles,
      footStyles: { fillColor: [235, 235, 235], textColor: 20 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.setFontSize(11);
  doc.text("Transactions (NGN)", 14, y);
  autoTable(doc, {
    startY: y + 2,
    head: [
      ["Date", "Description", "Product", "You paid", "You received / charged"],
    ],
    body: data.transactions.length
      ? data.transactions.map((t) => [
          fmt(t.date),
          t.description,
          t.product,
          blank(t.paid),
          blank(t.received),
        ])
      : [["", "No transactions in this year", "", "", ""]],
    styles: { fontSize: 8 },
    headStyles,
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
  });

  const after = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.text(
    "Loan principal and interest appear under 'received / charged' because they increase what you owe. Generated from the cooperative's records.",
    14,
    after,
    { maxWidth: width - 28 },
  );

  doc.save(
    `statement-${data.year}-${(member.member_number || member.full_name).toString().replace(/\s+/g, "-")}.pdf`,
  );
}

export function downloadStatementExcel(data) {
  const wb = XLSX.utils.book_new();

  const summary = [
    [data.cooperative.name],
    [`Statement of Account — ${data.year}`],
    [
      `Member: ${data.member.full_name}`,
      data.member.member_number ? `No. ${data.member.member_number}` : "",
    ],
    [],
    ["SAVINGS"],
    ["Product", "Opening", "Paid in", "Withdrawn", "Closing"],
    ...data.savings.map((s) => [
      s.product,
      s.opening,
      s.paid_in,
      s.withdrawn,
      s.closing,
    ]),
    [],
    ["LOANS"],
    ["Product", "Opening", "Issued", "Interest added", "Repaid", "Balance"],
    ...data.loans.map((l) => [
      l.product,
      l.opening,
      l.issued,
      l.interest,
      l.repaid,
      l.closing,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

  const tx = [
    ["Date", "Description", "Product", "You paid", "You received / charged"],
    ...data.transactions.map((t) => [
      t.date,
      t.description,
      t.product,
      t.paid || "",
      t.received || "",
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tx), "Transactions");

  XLSX.writeFile(wb, `statement-${data.year}.xlsx`);
}
