import React, { useState } from "react";
import { Link } from "react-router-dom";
import LoanForm from "../components/Loans/LoanForm";
import LoanList from "../components/Loans/LoanList";

function LoansPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLoanAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <LoanForm onLoanAdded={handleLoanAdded} />
      <LoanList key={refreshKey} />
    </div>
  );
}

export default LoansPage;
