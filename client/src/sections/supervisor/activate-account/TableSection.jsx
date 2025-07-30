'use client';
import React from 'react';
import { Paper, Tab, Tabs } from '@mui/material';

function TableSection({ activeTab, handleTabChange }) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        backgroundColor: 'transparent'
      }}
    >
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Users" />
        <Tab label="Permissions" />
      </Tabs>
    </Paper>
  );
}

export default TableSection;
