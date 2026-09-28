import React from "react";
import { exportToExcel, exportToPDF } from "../utils/exportHelpers";
import Button from "./ui/Button";

function ExportButtons({ data, columns, fileName, title }) {
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={() => exportToExcel(data, columns, fileName)}
      >
        Export Excel
      </Button>
      <Button
        variant="secondary"
        onClick={() => exportToPDF(data, columns, fileName, title)}
      >
        Export PDF
      </Button>
    </div>
  );
}

export default ExportButtons;
