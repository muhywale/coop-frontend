import React, { useState, useEffect } from "react";
import TLedger from "./TLedger";

function MemberStatement({ fetchFn }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (String(year).length !== 4) return;
    setError("");
    fetchFn(year)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load the ledger"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-28"
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {data && data.blocks.length === 0 && (
        <p className="text-gray-500">No ledger activity for {data.year}.</p>
      )}
      {data && data.blocks.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {data.blocks.map((block) => (
            <TLedger
              key={`${block.category}-${block.title}`}
              ledger={block}
              year={data.year}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MemberStatement;
