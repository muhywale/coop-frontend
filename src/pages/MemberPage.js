import React, { useState } from 'react';
import MemberForm from '../components/Members/MemberForm';
import MemberList from '../components/Members/MemberList';

function MembersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMemberAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <MemberForm onMemberAdded={handleMemberAdded} />
      <MemberList key={refreshKey} />
    </div>
  );
}

export default MembersPage;
