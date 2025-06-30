'use client';
import React from 'react';
import { Paper, Tab, Tabs } from '@mui/material';

function TableSection({ activeTab, handleTabChange }) {
  return (
    <div>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          backgroundColor: 'transparent'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 120,
              borderRadius: '8px 8px 0 0',
              margin: '0 4px',
              transition: 'all 0.2s ease-in-out'
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Users" />
          <Tab label="Permissions" />
        </Tabs>
      </Paper>
    </div>
  );
}

export default TableSection;
