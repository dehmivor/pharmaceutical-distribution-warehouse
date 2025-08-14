// pages/warehouse/WarehouseDashboard.jsx
'use client';

import DashboardLayout from '@/sections/warehouse/dashboard-import/DashboardLayoutInspection';
import InspectionModeView from '@/sections/warehouse/dashboard-import/InspectionModeView';
import React, { useState } from 'react';
import useTrans from '@/hooks/useTrans';

// Components

/***************************  DASHBOARD - MAIN CONTAINER  ***************************/

export default function WarehouseDashboard() {
  const trans = useTrans();
  // ban đầu hiển thị dashboard
  const [showActivityTabs, setShowActivityTabs] = useState(false);

  const handleStartInspection = () => {
    setShowActivityTabs(true); // chuyển sang inspection mode
  };

  const handleBackToDashboard = () => {
    setShowActivityTabs(false); // quay lại dashboard
  };

  if (showActivityTabs) {
    return <InspectionModeView isVisible={showActivityTabs} onBackToDashboard={handleBackToDashboard} />;
  }

  return <DashboardLayout isVisible={!showActivityTabs} onStartInspection={handleStartInspection} />;
}
