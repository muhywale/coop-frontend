import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(data, columns, fileName) {
  const rows = data.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      obj[col.label] = row[col.key];
    });
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToPDF(data, columns, fileName, title) {
  const doc = new jsPDF({
    orientation: columns.length > 6 ? "landscape" : "portrait",
  });
  doc.setFontSize(14);
  doc.text(title || fileName, 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.label)],
    body: data.map((row) =>
      columns.map((c) => {
        const v = row[c.key];
        return typeof v === "number" ? v.toLocaleString() : (v ?? "");
      }),
    ),
    styles: { fontSize: columns.length > 10 ? 6 : 8 },
    headStyles: { fillColor: [47, 126, 216] },
  });

  doc.save(`${fileName}.pdf`);
}
