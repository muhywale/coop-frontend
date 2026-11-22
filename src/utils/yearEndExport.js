import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const num = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// One table used by the page, the Excel file and the PDF, so they always agree.
// The first two columns are text, every column after them is a number.
export function buildTable(data) {
  const head = [
    "No.",
    "Member",
    ...data.products.map((p) => p.name),
    "Total savings",
    "Paid in this year",
    "Withdrawn this year",
    "One-off interest charged",
    "Interest paid separately",
    "Total interest",
    "Loan repayments",
    "Loans owed at year end",
  ];

  const line = (r) => [
    r.member_number || "",
    r.full_name + (r.status && r.status !== "active" ? " (inactive)" : ""),
    ...data.products.map((p) => r.balances[p.id] || 0),
    r.total_savings,
    r.paid_in,
    r.withdrawn,
    r.interest_oneoff,
    r.interest_paid,
    r.interest_total,
    r.loan_repaid,
    r.loan_outstanding,
  ];

  return {
    head,
    body: data.rows.map(line),
    foot: line({
      member_number: "",
      full_name: "TOTAL",
      status: "active",
      ...data.totals,
    }),
  };
}

export function downloadYearEndExcel(data, cooperativeName) {
  const { head, body, foot } = buildTable(data);
  const sheet = XLSX.utils.aoa_to_sheet([
    [cooperativeName || ""],
    [
      `Year-end report ${data.year}: savings balances as at 31 December ${data.year}`,
    ],
    [],
    head,
    ...body,
    foot,
  ]);

  // Real numbers, shown with two decimals, so you can add them up in Excel
  Object.keys(sheet).forEach((address) => {
    if (address[0] !== "!" && sheet[address].t === "n")
      sheet[address].z = "#,##0.00";
  });
  sheet["!cols"] = head.map((h, i) => ({
    wch: i === 0 ? 9 : i === 1 ? 30 : Math.max(14, Math.round(h.length * 0.9)),
  }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, `Year-end ${data.year}`);
  XLSX.writeFile(book, `year-end-report-${data.year}.xlsx`);
}

export function downloadYearEndPDF(data, cooperativeName) {
  const { head, body, foot } = buildTable(data);
  const doc = new jsPDF({ orientation: "landscape", format: "a3" });
  const width = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.text(cooperativeName || "Cooperative", width / 2, 14, {
    align: "center",
  });
  doc.setFontSize(11);
  doc.text(
    `Year-end report ${data.year} (NGN). Savings balances as at 31 December ${data.year}`,
    width / 2,
    21,
    { align: "center" },
  );

  const format = (row) => row.map((v, i) => (i < 2 ? String(v) : num(v)));
  const columnStyles = {};
  head.forEach((_, i) => {
    if (i >= 2) columnStyles[i] = { halign: "right" };
  });

  autoTable(doc, {
    startY: 27,
    head: [head],
    body: body.map(format),
    foot: [format(foot)],
    showFoot: "lastPage",
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [47, 126, 216], fontSize: 7 },
    footStyles: {
      fillColor: [235, 235, 235],
      textColor: 20,
      fontStyle: "bold",
    },
    columnStyles,
  });

  doc.save(`year-end-report-${data.year}.pdf`);
}
