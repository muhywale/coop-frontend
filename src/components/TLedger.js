import React from "react";

const cell =
  "border border-gray-700 px-2 py-1 text-right text-sm whitespace-nowrap";
const labelCell =
  "border border-gray-700 px-2 py-1 text-left text-sm font-bold whitespace-nowrap";

const money = (n) =>
  n > 0.004
    ? Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
const total = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TLedger({ ledger, year }) {
  const { rows, balance, grand } = ledger;
  const balanceDr = balance.side === "dr" ? balance.amount : 0;
  const balanceCr = balance.side === "cr" ? balance.amount : 0;

  return (
    <div>
      <h4 className="text-center font-bold text-sm uppercase mb-1">
        {ledger.title} ledger{year ? ` — ${year}` : ""}
      </h4>
      <table className="w-full border-collapse border border-gray-700">
        <thead>
          <tr className="bg-gray-100">
            <th className={labelCell}>MONTH</th>
            <th className={`${cell} font-bold`}>DR</th>
            <th className={`${cell} font-bold`}>CR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className={r.highlight ? "bg-orange-300" : ""}>
              <td className={labelCell}>
                {r.label}
                {r.highlight && (
                  <span className="ml-1 text-[10px] font-normal">
                    (total interest)
                  </span>
                )}
              </td>
              <td className={cell}>{money(r.dr)}</td>
              <td className={cell}>{money(r.cr)}</td>
            </tr>
          ))}
          <tr>
            <td className={`${labelCell} text-right`}>BALANCE &gt;</td>
            <td className={cell}>{money(balanceDr)}</td>
            <td className={cell}>{money(balanceCr)}</td>
          </tr>
          <tr className="bg-green-200 font-bold">
            <td className={labelCell}></td>
            <td className={cell}>{total(grand)}</td>
            <td className={cell}>{total(grand)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TLedger;
