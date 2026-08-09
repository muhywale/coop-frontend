import React from "react";
import ContributionList from "../components/Contributions/ContributionList";

function ContributionsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        All Transactions
      </h2>
      <ContributionList />
    </div>
  );
}

export default ContributionsPage;
