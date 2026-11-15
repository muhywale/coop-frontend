import jsPDF from "jspdf";

const naira = (n) =>
  `NGN ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function downloadReceiptPDF(r) {
  const doc = new jsPDF({ format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const left = 14;
  const right = w - 14;

  doc.setDrawColor(150);
  doc.rect(8, 8, w - 16, 150);

  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.text(r.cooperative.name || "Cooperative", w / 2, 20, {
    align: "center",
    maxWidth: w - 30,
  });
  doc.setFontSize(11);
  doc.text(r.title, w / 2, 29, { align: "center" });
  doc.setFont(undefined, "normal");

  doc.setFontSize(9);
  doc.text(`Receipt no: ${r.receipt_no}`, left, 40);
  doc.text(
    `Date: ${new Date(`${r.date}T00:00:00`).toLocaleDateString()}`,
    right,
    40,
    { align: "right" },
  );
  doc.line(left, 44, right, 44);

  let y = 53;
  const row = (label, value) => {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(label, left, y);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(String(value), left + 38, y, { maxWidth: right - left - 38 });
    y += 9;
  };

  row("Member", r.member.full_name);
  if (r.member.member_number) row("Member no", r.member.member_number);
  row("For", r.product ? `${r.description}: ${r.product}` : r.description);

  y += 2;
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(r.amount_label, left, y);
  doc.setTextColor(0);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(naira(r.amount), left, y + 10);
  doc.setFont(undefined, "normal");
  y += 20;

  if (r.balance) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(r.balance.label, left, y, { maxWidth: right - left });
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(naira(r.balance.amount), left, y + 7);
    y += 16;
  }

  doc.line(left, 138, right, 138);
  doc.setFontSize(7.5);
  doc.setTextColor(110);
  doc.text(
    "Generated from the cooperative's records. Keep this for your reference.",
    w / 2,
    144,
    { align: "center", maxWidth: w - 30 },
  );
  if (r.cooperative.phone) {
    doc.text(`Questions? ${r.cooperative.phone}`, w / 2, 150, {
      align: "center",
    });
  }

  doc.save(`${r.receipt_no}.pdf`);
}
