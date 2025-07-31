'use client';
import React from 'react';
import { Paper, Tab, Tabs } from '@mui/material';
import useTrans from '@/hooks/useTrans';

function TableSection({ activeTab, handleTabChange }) {
  const trans = useTrans();
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        backgroundColor: 'transparent'
      }}
    >
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label={trans.tabs.users} />
        <Tab label={trans.tabs.permissions} />
      </Tabs>
    </Paper>
  );
}

export default TableSection;
