// pages/warehouse/WarehouseDashboard.jsx
'use client';

import DashboardLayout from '@/sections/warehouse/dashboard-import/DashboardLayoutInspection';
import InspectionModeView from '@/sections/warehouse/dashboard-import/InspectionModeView';
import React, { useState } from 'react';

// Components

/***************************  DASHBOARD - MAIN CONTAINER  ***************************/

export default function WarehouseDashboard() {
  const [showActivityTabs, setShowActivityTabs] = useState(false);

  const handleStartInspection = () => {
    setShowActivityTabs(true);
  };

  const handleBackToDashboard = () => {
    setShowActivityTabs(false);
  };

  // Conditional rendering based on current view
  if (showActivityTabs) {
    return <InspectionModeView isVisible={showActivityTabs} onBackToDashboard={handleBackToDashboard} />;
  }

  return <DashboardLayout isVisible={!showActivityTabs} onStartInspection={handleStartInspection} />;
}
